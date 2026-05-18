import json
from functools import lru_cache
from urllib.error import URLError
from urllib.request import urlopen

import jwt
from cryptography import x509
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
FIREBASE_ISSUER_BASE = "https://securetoken.google.com"


class FirebaseAuthError(Exception):
    pass


class FirebaseConfigurationError(FirebaseAuthError):
    pass


@lru_cache(maxsize=1)
def _fetch_firebase_certs() -> dict:
    try:
        with urlopen(FIREBASE_CERTS_URL, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError) as exc:
        raise FirebaseAuthError("Unable to validate Google sign-in right now. Please try again.") from exc


def _load_project_id() -> str:
    project_id = settings.FIREBASE_PROJECT_ID.strip()
    if not project_id:
        raise FirebaseConfigurationError("Firebase Google sign-in is not configured on the server.")
    return project_id


def _load_allowed_audiences(project_id: str) -> list[str]:
    audiences = [project_id]
    project_number = settings.FIREBASE_PROJECT_NUMBER.strip()
    if project_number:
        audiences.append(project_number)
    return audiences


def _load_allowed_issuers(project_id: str) -> list[str]:
    issuers = [f"{FIREBASE_ISSUER_BASE}/{project_id}"]
    project_number = settings.FIREBASE_PROJECT_NUMBER.strip()
    if project_number:
        issuers.append(f"{FIREBASE_ISSUER_BASE}/{project_number}")
    return issuers


def _load_public_key_from_cert(cert: str):
    try:
        certificate = x509.load_pem_x509_certificate(cert.encode("utf-8"))
    except ValueError as exc:
        raise FirebaseAuthError("Firebase ID token certificate could not be parsed.") from exc
    return certificate.public_key()


def _build_token_error_message(exc: jwt.PyJWTError, id_token: str, project_id: str) -> str:
    if not settings.DEBUG:
        return "Firebase ID token is invalid or expired."

    expected_audiences = _load_allowed_audiences(project_id)
    expected_issuers = _load_allowed_issuers(project_id)
    try:
        claims = jwt.decode(id_token, options={"verify_signature": False})
    except jwt.PyJWTError:
        claims = {}

    actual_audience = claims.get("aud", "unknown")
    actual_issuer = claims.get("iss", "unknown")
    return (
        f"Firebase ID token failed validation ({exc.__class__.__name__}). "
        f"aud={actual_audience}; expected one of {expected_audiences}. "
        f"iss={actual_issuer}; expected one of {expected_issuers}."
    )


def verify_firebase_google_id_token(id_token: str) -> dict:
    if not id_token:
        raise FirebaseAuthError("Firebase ID token is required.")

    project_id = _load_project_id()

    try:
        header = jwt.get_unverified_header(id_token)
    except jwt.PyJWTError as exc:
        raise FirebaseAuthError("Firebase ID token is invalid.") from exc

    cert = _fetch_firebase_certs().get(header.get("kid"))
    if not cert:
        _fetch_firebase_certs.cache_clear()
        cert = _fetch_firebase_certs().get(header.get("kid"))
    if not cert:
        raise FirebaseAuthError("Firebase ID token could not be verified.")

    try:
        claims = jwt.decode(
            id_token,
            _load_public_key_from_cert(cert),
            algorithms=["RS256"],
            audience=_load_allowed_audiences(project_id),
            issuer=_load_allowed_issuers(project_id),
        )
    except jwt.PyJWTError as exc:
        raise FirebaseAuthError(_build_token_error_message(exc, id_token, project_id)) from exc

    sign_in_provider = claims.get("firebase", {}).get("sign_in_provider")
    if sign_in_provider != "google.com":
        raise FirebaseAuthError("Please use a Google account to continue.")

    return claims


def authenticate_firebase_google_user(id_token: str):
    claims = verify_firebase_google_id_token(id_token)
    email = (claims.get("email") or "").strip()
    if not email:
        raise FirebaseAuthError("Google did not return an email address for this account.")

    full_name = (claims.get("name") or "").strip()
    if not full_name:
        full_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()

    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        user = User.objects.create_user(email=email, password=None, name=full_name)
    elif full_name and user.name != full_name:
        user.name = full_name
        user.save(update_fields=["name", "updated_at"])

    return user
