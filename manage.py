#!/usr/bin/env python
"""Keep Django commands available from the repository root."""
import runpy
import sys
from pathlib import Path


def main():
    backend_dir = Path(__file__).resolve().parent / "backend"
    sys.path.insert(0, str(backend_dir))
    runpy.run_path(str(backend_dir / "manage.py"), run_name="__main__")


if __name__ == "__main__":
    main()
