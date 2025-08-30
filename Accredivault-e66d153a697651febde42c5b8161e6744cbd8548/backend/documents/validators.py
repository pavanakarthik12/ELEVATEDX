import random

def validate_document(file):
    """
    AI validation with basic file validation
    Returns confidence score and list of issues
    """
    issues = []
    
    # Basic file validation
    if not file.name.lower().endswith('.pdf'):
        return {
            'confidence': 0,
            'issues': ['Only PDF files are allowed']
        }
    
    # Check file size (10MB limit)
    max_size = 10 * 1024 * 1024  # 10MB in bytes
    if file.size > max_size:
        return {
            'confidence': 0,
            'issues': ['File size too large (maximum 10MB allowed)']
        }
    
    # Check if file is empty
    if file.size == 0:
        return {
            'confidence': 0,
            'issues': ['File is empty or corrupted']
        }
    
    # Simulate AI processing for valid files (works on metadata only; encryption is separate)
    confidence = random.randint(80, 95)  # Higher minimum confidence
    
    # Simulate common issues
    possible_issues = [
        "Signature missing",
        "Date format unclear", 
        "Institution seal not visible",
        "Text quality poor",
        "Watermark missing"
    ]
    
    # For testing: fewer issues, higher success rate
    if confidence > 90:
        issues = []  # No issues for high confidence
    elif confidence > 80:
        issues = random.sample(possible_issues, 1)  # Only 1 issue
    else:
        issues = random.sample(possible_issues, 2)  # Max 2 issues
    
    return {
        'confidence': confidence,
        'issues': issues
    }