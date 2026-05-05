from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.accounts.managers import UserManager


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]
    objects = UserManager()

    def save(self, *args, **kwargs):
        self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.email
