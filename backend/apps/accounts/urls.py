from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    OAuthCallbackView,
    OAuthCompleteView,
    OAuthStartView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("oauth/<str:provider>/start/", OAuthStartView.as_view(), name="oauth-start"),
    path("oauth/<str:provider>/callback/", OAuthCallbackView.as_view(), name="oauth-callback"),
    path("oauth/complete/", OAuthCompleteView.as_view(), name="oauth-complete"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
