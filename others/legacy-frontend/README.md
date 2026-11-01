# Archived frontend sources

These Django templates, browser scripts and the previous DOM bridge are retained
only as migration history. Django's template directories and Vite's entry point
do not load them. The website runs entirely from `frontend/src/` and JSON APIs.

`others/scripts/convert_react_pages.py` was the one-time migration utility. It
produced checked-in React JSX and data-only backend contracts. The generated
files can now be maintained directly; this script is not part of the build.
