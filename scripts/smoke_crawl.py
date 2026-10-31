"""Smoke-crawl every page as every role against the seeded database.

    python manage.py shell -c "exec(open('scripts/smoke_crawl.py', encoding='utf-8').read())"

Prints only problems (a 500, an unexpected status) and a summary. Run `python manage.py seed` first.
"""
import logging

from django.conf import settings
from django.test import Client

from core.models import Dispatch, InstallJob, Project, Serial, Survey, Ticket, User

logging.disable(logging.CRITICAL)
settings.ALLOWED_HOSTS = ["*", "testserver"]
bad, total = [], 0


def get(client, url, expect=200, who=""):
    global total
    total += 1
    try:
        r = client.get(url)
    except Exception as e:  # a template or view error
        bad.append(f"EXC  {who:9} {url}: {type(e).__name__}: {str(e)[:200]}")
        return None
    if r.status_code != expect:
        bad.append(f"{r.status_code}  {who:9} {url} (expected {expect})")
    return r


def login(username):
    c = Client()
    c.force_login(User.objects.get(username=username))
    return c


def proj(name):
    return Project.objects.get(customer__name=name)


projects = [proj(n) for n in ["Ramesh Kulkarni", "Anand Rajan", "Padma Shetty", "Rohit Menon", "Imtiaz Ahmed", "Karthik Subramanian",
                             "Swati Kulkarni", "Gopal Krishna", "Vinod Menon", "Rekha Pillai", "Aditya Sinha", "Joshi Residence", "Tarun Jain"]]
tabs = ["overview", "qualification", "survey", "quote", "payments", "dispatch", "install", "tickets", "subsidy", "timeline"]

for who in ["arjun", "vikram", "meera", "lakshmi", "divya"]:
    c = login(who)
    for p in projects:
        for t in tabs:
            get(c, f"/app/p/{p.id}/?tab={t}", who=who)
    for u in ["/app/", "/app/crm/", "/app/crm/?view=list", "/app/crm/?view=list&stage=completed", "/app/crm/?owner=me", "/notifications/"]:
        get(c, u, who=who)
    get(c, "/app/crm/new/", expect=200 if who in ("arjun", "meera", "divya") else 302, who=who)

c = login("kiran")
for u in ["/app/", "/app/inventory/", "/app/inventory/receive/", "/app/inventory/serials/", "/app/inventory/serials/?q=INV3K",
          "/app/inventory/dispatch/", "/app/inventory/dispatch/?status=dispatched", "/app/inventory/dispatch/?status=delivered"]:
    get(c, u, who="kiran")
for d in list(Dispatch.objects.all()[:40:6]) + [proj(n).dispatches.first() for n in ["Gopal Krishna", "Vinod Menon", "Rekha Pillai"]]:
    get(c, f"/app/inventory/dispatch/{d.id}/", who="kiran")
get(c, f"/app/inventory/serials/{Serial.objects.filter(status='delivered').first().id}/", who="kiran")

get(login("imran"), "/app/field/", who="imran")
c = login("vikram")
get(c, "/app/field/schedule/", who="vikram")
for s in Survey.objects.filter(status="requested")[:2]:
    get(c, f"/app/field/survey/{s.id}/", who="vikram")
for j in InstallJob.objects.filter(status="scheduled")[:3]:
    get(c, f"/app/field/install/{j.id}/", who="vikram")
get(c, f"/app/field/delivery/{proj('Rekha Pillai').dispatches.first().id}/", who="vikram")

c = login("divya")
cust = proj("Ramesh Kulkarni").customer
for u in ["/app/help/", "/app/help/?q=9886000101", "/app/help/?q=INV3K", "/app/help/?q=Ramesh", f"/app/help/customer/{cust.id}/",
          f"/app/help/ticket/new/?customer={cust.id}", "/app/help/tickets/", "/app/help/tickets/?status=resolved"]:
    get(c, u, who="divya")
for t in Ticket.objects.all():
    get(c, f"/app/help/tickets/{t.id}/", who="divya")

for who in ["lakshmi", "meera"]:
    c = login(who)
    for u in ["/app/accounts/", "/app/accounts/?tab=invoices", "/app/accounts/?tab=subsidy", "/app/accounts/?tab=payroll", "/app/accounts/?tab=costs",
              "/app/accounts/payroll.csv", "/app/insights/", "/app/insights/?window=today", "/app/insights/?window=week", "/app/insights/?window=month",
              "/app/insights/export.csv", f"/app/insights/p/{projects[0].id}/", f"/app/insights/p/{projects[1].id}/", f"/app/insights/p/{projects[11].id}/"]:
        get(c, u, who=who)

get(login("kiran"), "/app/insights/", expect=302, who="kiran")
get(login("imran"), "/app/crm/", expect=302, who="imran")
get(Client(), "/app/", expect=302, who="anonymous")

print(f"{total} pages crawled, {len(bad)} problems")
for line in bad[:40]:
    print(line)
