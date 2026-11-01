"""Helpers shared by the staff views."""
from functools import wraps

from django.contrib import messages
from django.shortcuts import redirect

from core.rules import RuleError


def staff_required(*roles):
    """Staff only. With roles given, other roles are bounced home (Directors may open everything)."""
    def deco(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            user = request.user
            if not user.is_authenticated:
                return redirect(f"/login/?next={request.path}")
            if user.is_customer:
                return redirect("/portal/")
            if roles and user.role != "director" and user.role not in roles:
                messages.error(request, "Your role does not have access to that page.")
                return redirect("/app/")
            return view(request, *args, **kwargs)
        return wrapper
    return deco


def run(request, fn, *args, ok=None, **kwargs):
    """Call a workflow rule. A blocked guard becomes a red flash message with the rule's own words."""
    try:
        result = fn(*args, **kwargs)
    except RuleError as e:
        messages.error(request, e.message)
        return False, None
    if ok:
        messages.success(request, ok)
    return True, result


def back(request, default):
    nxt = request.POST.get("next", "")
    return redirect(nxt if nxt.startswith("/") and not nxt.startswith("//") else default)
