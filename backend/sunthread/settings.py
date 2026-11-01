"""SunThread settings. Local-demo defaults; override with environment variables."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BASE_DIR.parent
CSRF_FAILURE_VIEW = 'core.api.csrf_failure'

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = os.environ.get("DEBUG", "1") == "1"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "*").split(",") if h.strip()]

# Demo mode adds the user switcher and the "Scan next (demo)" helper.
DEMO_MODE = os.environ.get("DEMO_MODE", "1" if DEBUG else "0") == "1"

# Shared secret for the inbound enquiry webhook. A published fallback exists only for local debug runs.
ENQUIRY_API_KEY = os.environ.get("ENQUIRY_API_KEY", "demo-key" if DEBUG else "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
    "portal",
    "backoffice",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "sunthread.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.context.ui",
            ],
            "builtins": ["core.templatetags.sun", "django.templatetags.static"],
        },
    },
]

WSGI_APPLICATION = "sunthread.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "OPTIONS": {
            "timeout": 20,
        },
    }
}

AUTH_USER_MODEL = "core.User"
AUTHENTICATION_BACKENDS = [
    "core.auth_backends.PhoneEmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]
LOGIN_URL = "/login/"

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = False
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = []
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

from django.contrib.messages import constants as _m  # noqa: E402

MESSAGE_TAGS = {_m.DEBUG: "info", _m.INFO: "info", _m.SUCCESS: "success", _m.WARNING: "warn", _m.ERROR: "error"}

# Used to build absolute links in customer messages (wa.me text).
SITE_URL = os.environ.get("SITE_URL", "http://localhost:5173")
GEOCODER_URL = os.environ.get("GEOCODER_URL", "https://photon.komoot.io")

# Fast password hashing for the test suite only.
import sys  # noqa: E402

if "test" in sys.argv:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
