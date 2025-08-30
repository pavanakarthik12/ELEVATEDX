def get_user_from_headers(request):
    """Extract user info from custom headers"""
    user_id = request.headers.get('x-user-id')
    user_role = request.headers.get('x-user-role')
    
    # Validate headers exist
    if not user_id or not user_role:
        raise ValueError("Missing required headers: x-user-id and x-user-role")
    
    # Validate role
    valid_roles = ['STUDENT', 'VERIFIER', 'ADMIN']
    if user_role not in valid_roles:
        raise ValueError(f"Invalid role: {user_role}. Must be one of {valid_roles}")
    
    return user_id, user_role

def validate_role(required_role, user_role):
    """Check if user has required role"""
    role_hierarchy = {
        'STUDENT': 1,
        'VERIFIER': 2,
        'ADMIN': 3
    }
    return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)

def validate_file_type(file):
    """Validate file type and basic properties"""
    allowed_extensions = ['.pdf']
    file_name = file.name.lower()
    
    # Check extension
    if not any(file_name.endswith(ext) for ext in allowed_extensions):
        return False, f"File type not allowed. Only {', '.join(allowed_extensions)} files are supported."
    
    # Check file size
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        return False, f"File too large. Maximum size is {max_size // (1024*1024)}MB."
    
    if file.size == 0:
        return False, "File is empty."
    
    return True, "File is valid"

def format_error_response(message, details=None):
    """Format consistent error responses"""
    response = {"error": message}
    if details:
        response["details"] = details
    return response

def format_success_response(data, message=None):
    """Format consistent success responses"""
    response = data
    if message:
        response["message"] = message
    return response

# Crypto helpers (thin wrappers used across views)
def get_encryption_key_from_settings():
    """Return raw 32-byte encryption key from settings or None."""
    try:
        from django.conf import settings
        return getattr(settings, 'ENCRYPTION_KEY', None)
    except Exception:
        return None