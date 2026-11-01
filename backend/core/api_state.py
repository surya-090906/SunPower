"""Authorized session and native React page data."""
from django.conf import settings
from django.middleware.csrf import get_token

FORM_FIELDS = ('name', 'phone', 'email', 'site_lat', 'site_lng', 'address', 'city', 'pincode',
               'segment', 'roof', 'package', 'kw', 'bill', 'area', 'notes', 'subsidy')

def build_state(context):
    request = context['request']
    user = request.user
    signed_in = user.is_authenticated
    path = request.path
    customer = context.get('customer')
    initial = context.get('form') or {}
    state = {
        'path': path,
        'page': {'/': 'landing', '/login/': 'login', '/employee/login/': 'employee_login', '/otp/': 'otp', '/enquire/': 'enquire',
                 '/app/': 'dashboard', '/portal/': 'projects'}.get(path, 'workflow'),
        'csrf': get_token(request),
        'title': 'SunPower',
        'demoMode': settings.DEMO_MODE,
        'geocoderUrl': settings.GEOCODER_URL,
        'user': {'name': user.display_name, 'firstName': user.first_name, 'role': user.get_role_display(),
                 'id': user.pk, 'isCustomer': user.is_customer} if signed_in else None,
        'navigation': [{'label': label, 'href': url, 'active': active} for label, url, active in
                       context.get('portal_nav' if signed_in and user.is_customer else 'nav_items', [])],
        'unread': context.get('unread_count', 0),
        'demoUsers': [{'id': u.pk, 'name': u.display_name, 'role': u.get_role_display()}
                      for u in context.get('demo_users', [])] if settings.DEMO_MODE and signed_in else [],
        'messages': [{'text': str(m), 'level': m.tags} for m in context.get('messages', [])],
        # Never serialize passwords, arbitrary POST bodies, model dictionaries or session data.
        'form': {key: str(initial.get(key, '')) for key in FORM_FIELDS},
        'next': context.get('next', ''),
        'username': request.POST.get('username', '') if path in ('/login/', '/employee/login/') else '',
        'employeePortal': path == '/employee/login/' or bool(context.get('employee_portal')),
        'customer': {'name': customer.name, 'phone': customer.phone, 'email': customer.email}
                    if signed_in and user.is_customer and customer else None,
        'otp': {'step': context.get('step', 'request'), 'phone': context.get('phone', '')},
    }
    if path == '/app/' and signed_in and not user.is_customer:
        state['dashboard'] = {
            'queue': [{'label': label, 'value': value, 'href': url} for label, value, url in context.get('queue', [])],
            'tasks': [{'id': t.pk, 'title': t.title, 'customer': t.project.customer.name,
                       'href': f'/app/p/{t.project_id}/', 'due': t.due_at.isoformat() if t.due_at else None,
                       'overdue': bool(t.overdue)} for t in context.get('tasks', [])],
            'updates': [{'id': n.pk, 'title': n.title, 'body': n.body, 'href': f'/notifications/{n.pk}/go/',
                         'date': n.created_at.isoformat(), 'read': n.read_at is not None}
                        for n in context.get('notes', [])],
        }
    if path == '/portal/' and signed_in and user.is_customer:
        state['projects'] = [{'id': c['p'].pk, 'title': c['p'].title, 'code': c['p'].code,
                              'address': c['p'].site_address, 'kind': c['p'].get_kind_display(),
                              'capacity': str(c['p'].requested_kw), 'tracker': c['t']}
                             for c in context.get('cards', [])]
        state['openRequests'] = context.get('open_requests', 0)
    return state
