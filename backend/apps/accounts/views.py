import json

from django.http import HttpResponseRedirect
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.accounts.firebase_auth import (
    FirebaseAuthError,
    FirebaseConfigurationError,
    authenticate_firebase_google_user,
)
from apps.accounts.oauth import (
    OAuthConfigurationError,
    OAuthError,
    authenticate_provider_callback,
    build_frontend_callback_url,
    build_oauth_handoff_token,
    build_provider_authorization_url,
    issue_tokens_for_user,
    redeem_oauth_handoff_token,
)
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return ProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class OAuthStartView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, provider):
        try:
            authorization_url = build_provider_authorization_url(provider)
        except OAuthConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except OAuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"authorization_url": authorization_url}, status=status.HTTP_200_OK)


class OAuthCallbackView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request, provider):
        return self._handle_callback(request, provider)

    def post(self, request, provider):
        return self._handle_callback(request, provider)

    def _handle_callback(self, request, provider):
        payload = request.data if request.method == "POST" else request.query_params
        provider_error = payload.get("error")
        if provider_error:
            return HttpResponseRedirect(build_frontend_callback_url(error=str(provider_error)))

        raw_user = payload.get("user")
        user_payload = None
        if raw_user:
            try:
                user_payload = json.loads(raw_user) if isinstance(raw_user, str) else raw_user
            except json.JSONDecodeError:
                user_payload = None

        try:
            user = authenticate_provider_callback(
                provider=provider,
                code=payload.get("code", ""),
                state=payload.get("state", ""),
                user_payload=user_payload,
            )
            handoff_token = build_oauth_handoff_token(user.id)
            return HttpResponseRedirect(build_frontend_callback_url(token=handoff_token))
        except OAuthError as exc:
            return HttpResponseRedirect(build_frontend_callback_url(error=str(exc)))


class OAuthCompleteView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token", "")
        if not token:
            return Response({"detail": "OAuth completion token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = redeem_oauth_handoff_token(token)
        except OAuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                **issue_tokens_for_user(user),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class FirebaseGoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        id_token = request.data.get("id_token", "")

        try:
            user = authenticate_firebase_google_user(id_token)
        except FirebaseConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except FirebaseAuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                **issue_tokens_for_user(user),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
