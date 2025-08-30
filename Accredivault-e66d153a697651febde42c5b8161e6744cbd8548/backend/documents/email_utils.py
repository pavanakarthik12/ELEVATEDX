from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger('documents')

def notify_institution(subject, message, recipient):
    """
    Send email notification to institution/admin.
    
    Args:
        subject (str): Email subject line
        message (str): Email message body
        recipient (str): Recipient email address
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if email is configured
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            logger.warning("Email not configured. Skipping notification.")
            return False
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        
        logger.info(f"Email notification sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False

def notify_admin_document_verification_failed(doc_id, reason="Document verification failed"):
    """
    Convenience function to notify admin about document verification failure.
    
    Args:
        doc_id (str): Document ID that failed verification
        reason (str): Reason for failure
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "Document Verification Failed"
    message = f"""
Document verification has failed.

Document ID: {doc_id}
Reason: {reason}
Timestamp: {__import__('datetime').datetime.now().isoformat()}

Please review this document for potential tampering or issues.
    """.strip()
    
    admin_email = getattr(settings, 'ADMIN_EMAIL', settings.EMAIL_HOST_USER)
    if not admin_email:
        logger.warning("No admin email configured for notifications")
        return False
    
    return notify_institution(subject, message, admin_email)

