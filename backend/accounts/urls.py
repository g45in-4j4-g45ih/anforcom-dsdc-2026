from django.urls import path

from .views import RegisterView, login_view

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", login_view, name="auth-login"),
]
