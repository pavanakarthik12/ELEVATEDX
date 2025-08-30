#!/usr/bin/env python
"""
Test script for email functionality in Accredivault Django project.
Run this script to test if email notifications are working correctly.

Usage:
    python test_email.py
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir))

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'accredivault.settings')

# Setup Django
django.setup()

def test_email_functionality():
    """Test the email notification functionality"""
    try:
        from documents.email_utils import notify_institution, notify_admin_document_verification_failed
        from django.conf import settings
        
        print("🔧 Testing Email Configuration...")
        print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
        print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
        print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
        print(f"EMAIL_HOST_PASSWORD: {'Set' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else 'Not set'}")
        print(f"ADMIN_EMAIL: {getattr(settings, 'ADMIN_EMAIL', 'Not set')}")
        print()
        
        # Check if email is properly configured
        if not getattr(settings, 'EMAIL_HOST_USER', None) or not getattr(settings, 'EMAIL_HOST_PASSWORD', None):
            print("❌ Email not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env file")
            print("   See EMAIL_SETUP.md for detailed instructions")
            return False
        
        # Test basic email function
        print("📧 Testing basic email notification...")
        test_recipient = getattr(settings, 'ADMIN_EMAIL', settings.EMAIL_HOST_USER)
        
        success = notify_institution(
            subject="Accredivault Email Test",
            message="This is a test email from Accredivault to verify email functionality is working correctly.",
            recipient=test_recipient
        )
        
        if success:
            print("✅ Basic email test successful!")
            print(f"   Email sent to: {test_recipient}")
        else:
            print("❌ Basic email test failed!")
            return False
        
        # Test verification failure notification
        print("\n📧 Testing verification failure notification...")
        success = notify_admin_document_verification_failed(
            doc_id="TEST-DOC-123",
            reason="Test verification failure for email testing"
        )
        
        if success:
            print("✅ Verification failure notification test successful!")
        else:
            print("❌ Verification failure notification test failed!")
            return False
        
        print("\n🎉 All email tests passed! Email functionality is working correctly.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Make sure you're running this script from the backend directory")
        return False
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Accredivault Email Functionality Test")
    print("=" * 50)
    
    success = test_email_functionality()
    
    if success:
        print("\n✅ Email functionality is working correctly!")
        print("   You can now use email notifications in your Django project.")
    else:
        print("\n❌ Email functionality test failed!")
        print("   Please check the error messages above and refer to EMAIL_SETUP.md")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    main()

