import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.utils.crypto import get_random_string

from apps.accounts.serializers import CustomTokenObtainPairSerializer


User = get_user_model()

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}

APPLE_AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"

STATE_SALT = "accounts.oauth.state"
HANDOFF_SALT = "accounts.oauth.handoff"


class OAuthError(Exception):
    pass


class OAuthConfigurationError(OAuthError):
    pass


@dataclass(frozen=True)
class OAuthProviderConfig:
    provider: str
    client_id: str
    client_secret: str
    redirect_uri: str


def _load_provider_config(provider: str) -> OAuthProviderConfig:
    if provider == "google":
        client_id = settings.GOOGLE_OAUTH_CLIENT_ID.strip()
        client_secret = settings.GOOGLE_OAUTH_CLIENT_SECRET.strip()
        redirect_uri = settings.GOOGLE_OAUTH_REDIRECT_URI.strip()
    elif provider == "apple":
        client_id = settings.APPLE_OAUTH_CLIENT_ID.strip()
        redirect_uri = settings.APPLE_OAUTH_REDIRECT_URI.strip()
        client_secret = _build_apple_client_secret()
    else:
        raise OAuthError("Unsupported OAuth provider.")

    if not client_id or not redirect_uri or not client_secret:
        raise OAuthConfigurationError(f"{provider.title()} sign-in is not configured on the server.")

    return OAuthProviderConfig(
        provider=provider,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
    )


def _build_apple_client_secret() -> str:
    client_id = settings.APPLE_OAUTH_CLIENT_ID.strip()
    team_id = settings.APPLE_OAUTH_TEAM_ID.strip()
    key_id = settings.APPLE_OAUTH_KEY_ID.strip()
    private_key = settings.APPLE_OAUTH_PRIVATE_KEY.strip()

    if not client_id or not team_id or not key_id or not private_key:
        return ""

    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=15)
    payload = {
        "iss": team_id,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "aud": APPLE_ISSUER,
        "sub": client_id,
    }
    headers = {"kid": key_id, "alg": "ES256"}
    try:
        token = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
    except Exception as exc:
        raise OAuthConfigurationError("Apple sign-in credentials are present but the private key could not be used.") from exc

    return token if isinstance(token, str) else token.decode("utf-8")


def build_provider_authorization_url(provider: str) -> str:
    config = _load_provider_config(provider)
    state = signing.dumps(
        {
            "provider": provider,
            "nonce": get_random_string(32),
        },
        salt=STATE_SALT,
    )
    nonce = signing.loads(state, salt=STATE_SALT)["nonce"]

    if provider == "google":
        params = {
            "client_id": config.client_id,
            "redirect_uri": config.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "nonce": nonce,
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTHORIZE_URL}?{urlencode(params)}"

    params = {
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
        "response_type": "code",
        "response_mode": "form_post",
        "scope": "name email",
        "state": state,
        "nonce": nonce,
    }
    return f"{APPLE_AUTHORIZE_URL}?{urlencode(params)}"


def authenticate_provider_callback(provider: str, code: str, state: str, user_payload: dict | None = None):
    if not code:
        raise OAuthError("Missing authorization code from the identity provider.")

    try:
        state_payload = signing.loads(state, salt=STATE_SALT, max_age=600)
    except signing.BadSignature as exc:
        raise OAuthError("The sign-in request is invalid or has expired. Please try again.") from exc

    if state_payload.get("provider") != provider:
        raise OAuthError("OAuth provider state did not match the callback.")

    nonce = state_payload.get("nonce", "")
    config = _load_provider_config(provider)

    if provider == "google":
        claims = _exchange_google_code(config, code, nonce)
    else:
        claims = _exchange_apple_code(config, code, nonce)

    email = (claims.get("email") or (user_payload or {}).get("email") or "").strip()
    if not email:
        raise OAuthError(f"{provider.title()} did not return an email address for this account.")

    full_name = _resolve_display_name(provider, claims, user_payload, email)
    user = User.objects.filter(email__iexact=email).first()

    if user is None:
        user = User.objects.create_user(
            email=email,
            password=None,
            name=full_name,
        )
    elif full_name and user.name != full_name:
        user.name = full_name
        user.save(update_fields=["name", "updated_at"])

    return user


def build_oauth_handoff_token(user_id: int) -> str:
    return signing.dumps({"user_id": user_id}, salt=HANDOFF_SALT)


def redeem_oauth_handoff_token(token: str):
    try:
        payload = signing.loads(token, salt=HANDOFF_SALT, max_age=300)
    except signing.BadSignature as exc:
        raise OAuthError("This sign-in link is invalid or has expired.") from exc

    try:
        return User.objects.get(pk=payload["user_id"])
    except User.DoesNotExist as exc:
        raise OAuthError("The account for this sign-in flow could not be found.") from exc


def issue_tokens_for_user(user):
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    access = refresh.access_token
    return {"access": str(access), "refresh": str(refresh)}


def build_frontend_callback_url(token: str | None = None, error: str | None = None) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    path = settings.OAUTH_FRONTEND_CALLBACK_PATH
    if not path.startswith("/"):
        path = f"/{path}"
    params = {}
    if token:
        params["token"] = token
    if error:
        params["error"] = error
    query = f"?{urlencode(params)}" if params else ""
    return f"{base}{path}{query}"


def _resolve_display_name(provider: str, claims: dict, user_payload: dict | None, email: str) -> str:
    if provider == "apple" and user_payload:
        name = user_payload.get("name") or {}
        first_name = (name.get("firstName") or "").strip()
        last_name = (name.get("lastName") or "").strip()
        full_name = " ".join(part for part in [first_name, last_name] if part).strip()
        if full_name:
            return full_name

    for candidate in [
        claims.get("name"),
        " ".join(part for part in [claims.get("given_name", ""), claims.get("family_name", "")] if part).strip(),
    ]:
        if candidate:
            return candidate.strip()

    return email.split("@")[0].replace(".", " ").replace("_", " ").title()


def _exchange_google_code(config: OAuthProviderConfig, code: str, nonce: str) -> dict:
    payload = _post_form(
        GOOGLE_TOKEN_URL,
        {
            "code": code,
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "redirect_uri": config.redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    id_token = payload.get("id_token")
    if not id_token:
        raise OAuthError("Google did not return an ID token.")

    claims = _decode_jwt(id_token, GOOGLE_JWKS_URL, config.client_id, GOOGLE_ISSUERS, nonce)
    if not claims.get("email_verified", False):
        raise OAuthError("Google returned an account without a verified email address.")
    return claims


def _exchange_apple_code(config: OAuthProviderConfig, code: str, nonce: str) -> dict:
    payload = _post_form(
        APPLE_TOKEN_URL,
        {
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": config.redirect_uri,
        },
    )
    id_token = payload.get("id_token")
    if not id_token:
        raise OAuthError("Apple did not return an ID token.")

    claims = _decode_jwt(id_token, APPLE_JWKS_URL, config.client_id, {APPLE_ISSUER}, nonce)
    return claims


def _decode_jwt(id_token: str, jwks_url: str, audience: str, issuers: set[str], nonce: str) -> dict:
    try:
        jwk_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(id_token)
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audience,
            options={"verify_aud": True},
        )
    except jwt.PyJWTError as exc:
        raise OAuthError("The identity token could not be verified.") from exc

    if claims.get("iss") not in issuers:
        raise OAuthError("The identity token came from an unexpected issuer.")

    if nonce and claims.get("nonce") and claims.get("nonce") != nonce:
        raise OAuthError("The identity token nonce did not match the original request.")

    return claims


def _post_form(url: str, data: dict) -> dict:
    encoded = urlencode(data).encode("utf-8")
    request = Request(
        url,
        data=encoded,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise OAuthError(_extract_provider_error(detail) or "The identity provider rejected the sign-in request.") from exc
    except URLError as exc:
        raise OAuthError("The identity provider could not be reached right now.") from exc


def _extract_provider_error(raw_error: str) -> str:
    try:
        data = json.loads(raw_error)
    except json.JSONDecodeError:
        return ""

    if isinstance(data, dict):
        if isinstance(data.get("error_description"), str):
            return data["error_description"]
        if isinstance(data.get("error"), str):
            return data["error"]
    return ""
