from dotenv import load_dotenv

load_dotenv()
import os
import dj_database_url
from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import Csv, config


BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool) -> bool:
    value = str(config(name, default=str(default))).strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    return default


def env_list(name: str, default: str) -> list[str]:
    raw_value = config(name, default=default)
    return [item.strip() for item in str(raw_value).split(",") if item.strip()]

SECRET_KEY = config("SECRET_KEY", default="change-me")
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = ["*"]

if not DEBUG and SECRET_KEY == "change-me":
    raise ValueError("Set a strong SECRET_KEY in production.")
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "apps.accounts",
    "apps.transactions",
    "apps.budgets",
    "apps.reports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

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
            ],
        },
    }
]

DATABASE_ENGINE = config("DATABASE_ENGINE", default="postgres").strip().lower()
DATABASE_URL = config("DATABASE_URL", default="").strip()
POSTGRES_CONN_MAX_AGE = config("POSTGRES_CONN_MAX_AGE", default=60, cast=int)
POSTGRES_SSL_REQUIRE = env_bool("POSTGRES_SSL_REQUIRE", not DEBUG)

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            os.getenv("DATABASE_URL")
        )
    }
    DATABASES["default"]["CONN_HEALTH_CHECKS"] = True
elif DATABASE_ENGINE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / config("SQLITE_NAME", default="db.sqlite3"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("POSTGRES_DB", default="expense_tracker"),
            "USER": config("POSTGRES_USER", default="postgres"),
            "PASSWORD": config("POSTGRES_PASSWORD", default="postgres"),
            "HOST": config("POSTGRES_HOST", default="localhost"),
            "PORT": config("POSTGRES_PORT", default="5432"),
            "CONN_MAX_AGE": POSTGRES_CONN_MAX_AGE,
            "CONN_HEALTH_CHECKS": True,
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

if not DEBUG:
    STORAGES["staticfiles"] = {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173" if DEBUG else "")
FRONTEND_URLS = env_list("FRONTEND_URLS", default=FRONTEND_URL)
CORS_ALLOWED_ORIGINS = [
    "https://snap-spend-two.vercel.app",
]
CSRF_TRUSTED_ORIGINS = FRONTEND_URLS

GOOGLE_OAUTH_CLIENT_ID = config("GOOGLE_OAUTH_CLIENT_ID", default="")
GOOGLE_OAUTH_CLIENT_SECRET = config("GOOGLE_OAUTH_CLIENT_SECRET", default="")
GOOGLE_OAUTH_REDIRECT_URI = config("GOOGLE_OAUTH_REDIRECT_URI", default="")
FIREBASE_PROJECT_ID = config("FIREBASE_PROJECT_ID", default="")
FIREBASE_PROJECT_NUMBER = config("FIREBASE_PROJECT_NUMBER", default="")

APPLE_OAUTH_CLIENT_ID = config("APPLE_OAUTH_CLIENT_ID", default="")
APPLE_OAUTH_TEAM_ID = config("APPLE_OAUTH_TEAM_ID", default="")
APPLE_OAUTH_KEY_ID = config("APPLE_OAUTH_KEY_ID", default="")
APPLE_OAUTH_PRIVATE_KEY = config("APPLE_OAUTH_PRIVATE_KEY", default="").replace("\\n", "\n")
APPLE_OAUTH_REDIRECT_URI = config("APPLE_OAUTH_REDIRECT_URI", default="")

OAUTH_FRONTEND_CALLBACK_PATH = config("OAUTH_FRONTEND_CALLBACK_PATH", default="/auth/callback")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

ML_ANOMALY_DEFAULT_CONTAMINATION = config("ML_ANOMALY_DEFAULT_CONTAMINATION", default=0.05, cast=float)
ML_ANOMALY_MIN_TRAINING_SAMPLES = config("ML_ANOMALY_MIN_TRAINING_SAMPLES", default=10, cast=int)
ML_ANOMALY_CACHE_ENABLED = env_bool("ML_ANOMALY_CACHE_ENABLED", True)
ML_ANOMALY_CACHE_DIR = str(BASE_DIR / config("ML_ANOMALY_CACHE_DIR", default="ml/model_cache"))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = env_bool("CSRF_COOKIE_HTTPONLY", True)
SESSION_COOKIE_SAMESITE = config("SESSION_COOKIE_SAMESITE", default="Lax")
CSRF_COOKIE_SAMESITE = config("CSRF_COOKIE_SAMESITE", default="Lax")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", not DEBUG)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=0 if DEBUG else 31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", not DEBUG)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = config("SECURE_REFERRER_POLICY", default="same-origin")
X_FRAME_OPTIONS = "DENY"

DJANGO_LOG_LEVEL = config("DJANGO_LOG_LEVEL", default="INFO").upper()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": DJANGO_LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": DJANGO_LOG_LEVEL,
            "propagate": False,
        }
    },
}
