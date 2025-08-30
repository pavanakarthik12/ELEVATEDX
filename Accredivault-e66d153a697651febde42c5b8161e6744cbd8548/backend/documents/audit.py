import hashlib
from .models import AuditLog

def make_hash(content):
    """Generate SHA-256 hex digest for short audit strings."""
    return hashlib.sha256(content.encode()).hexdigest()

def log_action_db(doc, action, actor):
    """Log action to database with hash"""
    content = f"{doc.doc_id}{action}{actor}{doc.status}"
    hash_value = make_hash(content)
    
    AuditLog.objects.create(
        doc=doc,
        action=action,
        actor=actor,
        hash=hash_value
    )
    
    return hash_value