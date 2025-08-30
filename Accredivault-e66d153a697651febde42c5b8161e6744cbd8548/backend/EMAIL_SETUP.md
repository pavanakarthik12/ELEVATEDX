# Email Notification Setup for Accredivault

This document explains how to set up email notifications in your Accredivault Django project.

## Prerequisites

1. **Gmail Account**: You need a Gmail account to send emails
2. **App Password**: You'll need to generate an App Password (not your regular Gmail password)

## Step 1: Generate Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification" (must be enabled)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

## Step 2: Configure Environment Variables

1. Copy `env_example.txt` to `.env` in your backend directory
2. Update the following variables in your `.env` file:

```bash
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
ADMIN_EMAIL=admin@yourinstitution.com
```

**Important**: 
- Use your full Gmail address for `EMAIL_HOST_USER`
- Use the 16-character App Password (without spaces) for `EMAIL_HOST_PASSWORD`
- Set `ADMIN_EMAIL` to the email where you want to receive verification failure notifications

## Step 3: Test Email Configuration

1. Start your Django server
2. Try uploading a document and then verifying it with a modified file
3. Check your admin email for the "Document Verification Failed" notification

## How It Works

### Email Notification Function

The project includes a reusable email function in `documents/email_utils.py`:

```python
from .email_utils import notify_institution

# Send custom notification
notify_institution(
    subject="Custom Subject",
    message="Custom message body",
    recipient="recipient@example.com"
)

# Send verification failure notification
from .email_utils import notify_admin_document_verification_failed
notify_admin_document_verification_failed(doc_id, "Failure reason")
```

### Automatic Notifications

The system automatically sends email notifications when:

1. **Document verification fails** due to hash mismatch
2. **File tampering is detected** during verification
3. **Verification process encounters errors**

### Email Content

Verification failure emails include:
- Document ID
- Reason for failure
- Timestamp
- Expected vs. actual hash values

## Troubleshooting

### Common Issues

1. **"Email not configured" warning**: Check your `.env` file and ensure variables are set correctly
2. **Authentication failed**: Verify your App Password is correct and 2FA is enabled
3. **Connection refused**: Check if your network allows SMTP connections to Gmail

### Testing

To test email functionality without triggering verification failures:

```python
# In Django shell or a test view
from documents.email_utils import notify_institution

notify_institution(
    "Test Email",
    "This is a test email from Accredivault",
    "your-test-email@example.com"
)
```

## Security Notes

- **Never commit your `.env` file** to version control
- **App Passwords are more secure** than regular passwords
- **Use environment variables** for all sensitive configuration
- **Monitor email logs** for any suspicious activity

## Customization

You can customize email notifications by:

1. Modifying the email templates in `email_utils.py`
2. Adding new notification types
3. Changing the admin email address
4. Adding multiple recipient lists

## Support

If you encounter issues:
1. Check the Django console logs for error messages
2. Verify your Gmail App Password is correct
3. Ensure 2FA is enabled on your Google account
4. Check your network's SMTP restrictions

