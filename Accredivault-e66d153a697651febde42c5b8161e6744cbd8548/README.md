# 🎓 AccrediVault - Secure Document Verification System

A blockchain-inspired document verification system that allows educational institutions to securely upload and encrypt student documents, while companies can verify their authenticity.

## 🚀 What's New (UI Improvements)

✅ **Stunning Modern UI** - Glassmorphism design with gradients and animations  
✅ **Professional Admin Portal** - Beautiful document upload interface  
✅ **Elegant User Portal** - Clean verification interface for companies  
✅ **Responsive Design** - Works perfectly on all devices  
✅ **Emoji Integration** - Friendly and intuitive user experience  

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │   Backend API   │    │   User Portal   │
│  (Institutions) │◄──►│   (Django)      │◄──►│   (Companies)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3 /      │
                       │   Local Storage │
                       └─────────────────┘
```

## 🚀 Quick Start (Hackathon)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (Admin Portal)
```bash
cd frontend
npm install
npm run dev
```

### 3. User Portal Setup
```bash
cd user-portal
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables (Create `.env` file in backend/)
```bash
# Email Configuration (Required for notifications)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
ADMIN_EMAIL=admin@yourinstitution.com

# AWS S3 (Optional - falls back to local storage)
USE_S3=True
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=us-east-1

# Encryption (Required)
ENCRYPTION_KEY_B64=your_base64_32_byte_key
```

### Generate Encryption Key
```python
import base64
import os
key = os.urandom(32)
print(base64.b64encode(key).decode())
```

### Email Setup
See [EMAIL_SETUP.md](backend/EMAIL_SETUP.md) for detailed instructions on configuring Gmail SMTP for notifications.

## 📱 Features

### Admin Portal (Institutions)
- 🔐 Secure PDF upload with AI validation
- 🔒 AES-256 encryption
- 🆔 Unique document ID generation
- 📊 Document status tracking
- 📥 Download stamped PDF

### User Portal (Companies)
- 🔍 Verify documents by file upload
- 🔐 Verify documents by hash
- ✅ Real-time verification results
- 📋 Document details display
- 📱 Mobile-responsive design

### Email Notifications
- 📧 Automatic admin notifications for verification failures
- 🔔 Tampering detection alerts
- 📬 Reusable email utility functions

## 🎯 Next Steps for Hackathon

### High Priority
1. **Test Email Configuration** - Set up Gmail credentials and test notifications
2. **Test S3 Integration** - Set up AWS credentials and test file uploads
3. **Test Encryption** - Verify files are properly encrypted
4. **Test Verification** - Ensure hash verification works correctly

### Medium Priority
1. **Add Document Status Management** - Approve/reject documents
2. **Improve Error Handling** - Better user feedback
3. **Add Loading States** - Smoother user experience

### Low Priority
1. **Add Analytics Dashboard** - Upload statistics
2. **Implement User Authentication** - Secure access control
3. **Add Audit Logging** - Track all actions

## 🧪 Testing

### Test Document Upload
1. Go to Admin Portal
2. Upload a PDF file
3. Check if encrypted file is stored
4. Verify stamped PDF download

### Test Document Verification
1. Go to User Portal
2. Use document ID and hash from upload
3. Verify document authenticity
4. Check result display

## 🛠️ Tech Stack

- **Backend**: Django 4.2.7, Django REST Framework
- **Frontend**: React 18, Vite
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Storage**: AWS S3 + Local fallback
- **Encryption**: AES-256-GCM
- **Styling**: Modern CSS with Glassmorphism

## 🎨 UI Features

- **Glassmorphism Design** - Modern, professional appearance
- **Gradient Backgrounds** - Eye-catching visual appeal
- **Smooth Animations** - Hover effects and transitions
- **Responsive Layout** - Works on all screen sizes
- **Professional Typography** - Inter font family
- **Color-coded Results** - Green for success, red for errors

## 🚨 Important Notes

- This is a hackathon project - production deployment requires security hardening
- Encryption keys should be stored securely in production
- S3 credentials should use IAM roles in production
- Add proper authentication and authorization for production use

## 📞 Support

For hackathon questions or issues:
1. Check the console logs
2. Verify environment variables
3. Test with simple PDF files first
4. Ensure all services are running

---

**Good luck with your hackathon! 🚀✨**
