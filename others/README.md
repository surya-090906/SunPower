# Supporting files

`docs/` contains the product specification, handoff and team notes. `scripts/` contains maintenance and verification tools. These files are not served as website assets or imported by the application at runtime.

Run scripts from the repository root:

```bash
node --test others/scripts/test_geocoding.cjs
python manage.py shell -c "exec(open('others/scripts/smoke_crawl.py', encoding='utf-8').read())"
```

The smoke crawl expects the existing seeded demo company. It checks pages as each staff and customer role.

React interaction tests run with `npm test` inside `frontend/`. The former Django frontend sources are retained in `legacy-frontend/` for migration history and are not loaded by the website. Deployment examples are in `deploy/`.
