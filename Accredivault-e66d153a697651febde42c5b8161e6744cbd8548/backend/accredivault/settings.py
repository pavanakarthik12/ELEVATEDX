import os
from pathlib import Path
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env')
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-hackathon-key-change-in-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'documents',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'accredivault.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'accredivault.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# CORS Settings (for React frontend)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # Backup port
    "http://127.0.0.1:3001",
]

CORS_ALLOW_ALL_ORIGINS = True  # For hackathon - restrict in production
CORS_ALLOW_CREDENTIALS = True

# CORS Headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-id',  # Custom headers for auth
    'x-user-role',
]

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Allowed file types (for additional validation)
ALLOWED_FILE_EXTENSIONS = ['.pdf']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Media Files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Security settings for hackathon (relaxed)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# AWS S3 Settings (Optional - falls back to local if not configured)
USE_S3 = os.getenv('USE_S3', 'False').lower() == 'true'


if USE_S3:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Encryption settings (hackathon-safe defaults; require env in real use)
# Fallback: if python-dotenv didn't populate env, manually read backend/.env
try:
    ENV_FILE = Path(__file__).resolve().parent.parent / '.env'
    if ENV_FILE.exists() and not os.getenv('ENCRYPTION_KEY_B64'):
        for _line in ENV_FILE.read_text(encoding='utf-8', errors='ignore').splitlines():
            if not _line or _line.strip().startswith('#') or '=' not in _line:
                continue
            _k, _v = _line.strip().split('=', 1)
            os.environ.setdefault(_k, _v)
except Exception:
    pass

ENCRYPTION_KEY_B64 = os.getenv('ENCRYPTION_KEY_B64')  # base64-encoded 32-byte key
if ENCRYPTION_KEY_B64:
    try:
        import base64
        _decoded = base64.b64decode(ENCRYPTION_KEY_B64)
        if len(_decoded) != 32:
            raise ValueError("ENCRYPTION_KEY_B64 must decode to 32 bytes for AES-256")
        ENCRYPTION_KEY = _decoded
    except Exception:
        ENCRYPTION_KEY = None
else:
    ENCRYPTION_KEY = None  # fallback: will error if encryption is attempted without key

# Language and timezone
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')  # Gmail address
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')  # Gmail App Password
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Admin email for notifications
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', EMAIL_HOST_USER)

# Logging (helpful for debugging during hackathon)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'documents': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}