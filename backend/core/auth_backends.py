from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

from .utils import normalize_phone


class PhoneEmailBackend(ModelBackend):
    """Log in with phone number, email or username plus password."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
        User = get_user_model()
        ident = username.strip()
        q = Q(username__iexact=ident)
        if "@" in ident:
            q |= Q(email__iexact=ident)
        phone = normalize_phone(ident)
        if phone:
            q |= Q(phone=phone)
        for user in User.objects.filter(q)[:5]:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None
