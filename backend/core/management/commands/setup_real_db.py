"""python manage.py setup_real_db

Initializes a clean, production-ready SQLite database for SunThread:
1. Applies all schema migrations.
2. Configures SQLite concurrency pragmas (WAL mode, Foreign Keys, busy_timeout=20s, synchronous=NORMAL).
3. Loads the full master product catalogue and kit templates (1-5 kW On-Grid, Off-Grid, Panel sets).
4. Creates official staff accounts across all operational roles (Admin, Sales, Engineer, Warehouse, Support, Accounts, Technicians).
5. Initializes warehouse opening stock for hardware equipment.
6. Leaves transactional tables clean (0 fake projects, 0 fake customers).
"""
import os
import shutil
from pathlib import Path
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

from core import clock, seed_data, sim
from core.models import Customer, Notification, Product, Project, Role, Serial, Ticket, User
from core.money import rupees


class Command(BaseCommand):
    help = "Initializes a real, production-ready SQLite database (WAL mode, master catalogue, staff accounts, clean slate)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-password",
            default=os.environ.get("ADMIN_PASSWORD", "SunPower@2026!"),
            help="Password for admin superuser (default: SunPower@2026!)",
        )
        parser.add_argument(
            "--staff-password",
            default=os.environ.get("STAFF_PASSWORD", "SunPower@2026!"),
            help="Password for staff role accounts (default: SunPower@2026!)",
        )
        parser.add_argument(
            "--no-stock",
            action="store_true",
            help="Do not seed opening warehouse stock (inventory will start at 0)",
        )
        parser.add_argument(
            "--no-backup",
            action="store_true",
            help="Do not backup existing db.sqlite3 before initializing",
        )

    def handle(self, *args, **options):
        admin_pw = options["admin_password"]
        staff_pw = options["staff_password"]
        db_file = Path(settings.DATABASES["default"]["NAME"])

        self.stdout.write(self.style.MIGRATE_HEADING("=== SunThread: Real SQLite Database Setup ==="))

        # 1. Backup existing database if present
        if db_file.exists() and not options["no_backup"]:
            backup_path = db_file.with_name(f"{db_file.name}.backup")
            shutil.copy2(db_file, backup_path)
            self.stdout.write(f"[OK] Backed up existing database to {backup_path.name}")

        # 2. Flush or migrate tables
        self.stdout.write("Applying database migrations...")
        call_command("migrate", interactive=False, verbosity=1)

        # Flush any existing rows
        call_command("flush", interactive=False, verbosity=0)
        self.stdout.write("[OK] Schema initialized and transactional tables cleared")

        # 3. Verify SQLite Pragmas
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA journal_mode = WAL;")
            jm = cursor.fetchone()[0]
            cursor.execute("PRAGMA foreign_keys = ON;")
            cursor.execute("PRAGMA foreign_keys;")
            fk = cursor.fetchone()[0]
            cursor.execute("PRAGMA busy_timeout = 20000;")
            cursor.execute("PRAGMA busy_timeout;")
            bt = cursor.fetchone()[0]
            cursor.execute("PRAGMA synchronous = NORMAL;")
            cursor.execute("PRAGMA synchronous;")
            sync = cursor.fetchone()[0]

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] SQLite Engine Configured: Journal Mode={jm.upper()}, Foreign Keys={'ON' if fk else 'OFF'}, "
                f"Busy Timeout={bt}ms, Synchronous={sync}"
            )
        )

        # 4. Create Media & Assets Directory
        media_seed = Path(settings.MEDIA_ROOT) / "seed"
        media_seed.mkdir(parents=True, exist_ok=True)
        placeholder_file = media_seed / "placeholder.svg"
        if not placeholder_file.exists():
            placeholder_file.write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">'
                '<rect width="800" height="600" fill="#f8fafc"/>'
                '<text x="400" y="300" font-family="sans-serif" font-size="24" fill="#64748b" text-anchor="middle">'
                'SunPower Solutions Document</text></svg>',
                encoding="utf-8"
            )

        # 5. Load Master Catalogue & Kit Templates
        self.stdout.write("Loading product catalogue and engineering kit templates...")
        products = seed_data.load_catalogue()
        self.stdout.write(f"[OK] Loaded {len(products)} products and 15 kit templates (1-5 kW On-Grid, Off-Grid, Panel sets)")

        # 6. Create Real Operational Staff Accounts
        self.stdout.write("Setting up staff organization accounts...")
        staff_hashed = make_password(staff_pw)
        admin_hashed = make_password(admin_pw)

        # Superuser Admin
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults=dict(
                first_name="SunPower",
                last_name="Administrator",
                email="admin@sunpower.example",
                phone="9800000000",
                role=Role.DIRECTOR,
                is_staff=True,
                is_superuser=True,
                password=admin_hashed,
            ),
        )
        admin_user.password = admin_hashed
        admin_user.is_staff = admin_user.is_superuser = True
        admin_user.save()

        # Operational Staff
        staff_roles = [
            ("meera", "Meera", "Iyer", Role.DIRECTOR, "9845000001", "Director / General Manager", True),
            ("arjun", "Arjun", "Nair", Role.SALES, "9845000002", "Senior Solar Consultant", False),
            ("sneha", "Sneha", "Patil", Role.SALES, "9845000003", "Solar Sales Consultant", False),
            ("vikram", "Vikram", "Rao", Role.ENGINEER, "9845000004", "Site Surveyor & Assessment Engineer", True),
            ("kiran", "Kiran", "Shetty", Role.WAREHOUSE, "9845000005", "Warehouse & Logistics Manager", False),
            ("divya", "Divya", "Menon", Role.SUPPORT, "9845000006", "Support Desk & Warranty Officer", False),
            ("lakshmi", "Lakshmi", "Krishnan", Role.ACCOUNTS, "9845000008", "Accounts & Finance Lead", False),
            ("imran", "Imran", "Khan", Role.TECHNICIAN, "9845010001", "Lead Installation Technician", True),
            ("ravi", "Ravi", "Kumar", Role.TECHNICIAN, "9845010002", "Installation Technician", True),
        ]

        created_staff = 0
        for username, first, last, role, phone, title, can_survey in staff_roles:
            u, _ = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    first_name=first,
                    last_name=last,
                    role=role,
                    phone=phone,
                    can_survey=can_survey,
                    email=f"{username}@sunpower.example",
                    password=staff_hashed,
                ),
            )
            u.password = staff_hashed
            u.can_survey = can_survey
            if role == Role.DIRECTOR:
                u.is_staff = u.is_superuser = True
            u.save()
            created_staff += 1

        self.stdout.write(f"[OK] Created superuser 'admin' and {created_staff} operational staff accounts")

        # 7. Seed Opening Stock (Unless --no-stock specified)
        if not options["no_stock"]:
            self.stdout.write("Initializing warehouse opening stock...")
            opening_stock = {
                "PNL-540": 40,
                "INV-1K": 3,
                "INV-2K": 3,
                "INV-3K": 5,
                "INV-4K": 3,
                "INV-5K": 3,
                "MPPT-60": 8,
                "BATT-48-100": 4,
                "STR-RCC": 40,
                "STR-TIN": 20,
                "DCDB": 15,
                "ACDB": 15,
                "CBL-DC": 500,
                "CBL-AC": 300,
                "MC4": 100,
                "EARTH-KIT": 25,
                "LA-KIT": 15,
                "PROT-SET": 15,
            }
            sim.stock_up(opening_stock)
            serial_count = Serial.objects.count()
            self.stdout.write(f"[OK] Initialized warehouse stock: {serial_count} serialized items ready for dispatch")
        else:
            self.stdout.write("[INFO] Skipping opening stock initialization (--no-stock)")

        # 8. Verify Clean Operational State
        projects_count = Project.objects.count()
        customers_count = Customer.objects.count()
        tickets_count = Ticket.objects.count()

        self.stdout.write("\n" + self.style.SUCCESS("=== Real Database Setup Complete ==="))
        self.stdout.write(f"- Projects: {projects_count} (Clean slate for real enquiries)")
        self.stdout.write(f"- Customers: {customers_count} (Clean slate for real customer registrations)")
        self.stdout.write(f"- Active Service Tickets: {tickets_count}")
        self.stdout.write(f"- Database File: {db_file}")
        self.stdout.write(f"- Journal Mode: {jm.upper()} (High-concurrency WAL mode enabled)")
        self.stdout.write("\nCredentials:")
        self.stdout.write(f"  Admin:      username 'admin'    / password '{admin_pw}'")
        self.stdout.write(f"  Sales:      username 'arjun'    / password '{staff_pw}'")
        self.stdout.write(f"  Engineer:   username 'vikram'   / password '{staff_pw}'")
        self.stdout.write(f"  Warehouse:  username 'kiran'    / password '{staff_pw}'")
        self.stdout.write(f"  Support:    username 'divya'    / password '{staff_pw}'")
        self.stdout.write(f"  Accounts:   username 'lakshmi'  / password '{staff_pw}'")
        self.stdout.write(f"  Technician: username 'imran'    / password '{staff_pw}'")
        self.stdout.write("\nReady to accept live customer enquiries at /enquire/ and staff logins at /login/.")
