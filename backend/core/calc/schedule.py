"""Technician scheduling: a heuristic, not an optimiser (blueprint section 5.5)."""
from datetime import date, timedelta

from ..models import JobAssignment, Survey, Ticket, User
from ..utils import next_working_day


def load_on(user, day: date) -> int:
    n = Survey.objects.filter(assignee=user, scheduled_for=day, status=Survey.Status.REQUESTED).count()
    n += JobAssignment.objects.filter(technician=user, job__scheduled_date=day, job__status="scheduled").count()
    n += Ticket.objects.filter(assignee=user, visit_date=day).exclude(status=Ticket.Status.CLOSED).count()
    return n


def _has_install(user, day: date) -> bool:
    return JobAssignment.objects.filter(technician=user, job__scheduled_date=day).exists()


def _load_week(user, start: date) -> int:
    return sum(load_on(user, start + timedelta(days=i)) for i in range(7))


def pick_technicians(start: date, n: int, kind: str = "install"):
    """Earliest working day on or after `start` with `n` free technicians, least loaded first.

    install: one job per technician per day. survey/ticket: up to 3 visits a day, never on an install day.
    """
    techs = User.objects.filter(role="technician", is_active=True).order_by("id")
    if kind == "survey":
        techs = techs.filter(can_survey=True)
    techs = list(techs)
    day = next_working_day(start)
    if not techs:
        return day, []
    for _ in range(60):
        free = []
        for t in techs:
            load = load_on(t, day)
            if kind == "install":
                if load >= 1:
                    continue
            elif load >= 3 or _has_install(t, day):
                continue
            free.append((_load_week(t, day), t.id, t))
        if len(free) >= n:
            free.sort(key=lambda x: (x[0], x[1]))
            return day, [x[2] for x in free[:n]]
        day = next_working_day(day + timedelta(days=1))
    return day, techs[:n]
