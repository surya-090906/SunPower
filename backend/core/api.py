"""JSON-only application API. No application page is rendered as Django HTML.

Page contracts explicitly project values already authorized by each view. Only
the active branches and loop items are evaluated; model dictionaries, private
attributes, password fields and arbitrary client-supplied projections are never
serialized. React owns the page structure and every interactive form.
"""
import json
import math
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from django.contrib import messages
from django.contrib.messages import get_messages
from django.core.exceptions import PermissionDenied
from django.http import Http404, JsonResponse
from django.middleware.csrf import get_token
from django.template import Context, Engine
from django.urls import resolve, reverse
from django.views.decorators.http import require_http_methods

from .context import ui


@lru_cache(maxsize=1)
def contracts():
    return json.loads(Path(__file__).with_name('page_contracts.json').read_text(encoding='utf-8'))


@lru_cache(maxsize=2048)
def expression(source):
    # All sources come from checked-in contracts, never a query or request body.
    return Engine.get_default().from_string('{{ '+source+' }}').nodelist[0].filter_expression


@lru_cache(maxsize=1024)
def condition(source):
    return Engine.get_default().from_string('{% if '+source+' %}x{% endif %}').nodelist[0].conditions_nodelists[0][0]


def value(source, context):
    return expression(source).resolve(context, ignore_failures=True)


def display(item):
    if item is None:return ''
    return str(item)


def project(nodes, context):
    result={}
    for node in nodes:
        kind=node['kind']
        if kind=='value':result[node['key']]=display(value(node['expr'],context))
        elif kind=='if':
            result[node['key']]=-1
            for index,branch in enumerate(node['branches']):
                if branch['condition'] is None or condition(branch['condition']).eval(context):
                    result[node['key']]=index
                    result.update(project(branch['body'],context))
                    break
        elif kind=='for':
            items=list(value(node['expr'],context) or [])
            if node.get('reverse'):items.reverse()
            rows=[]
            parent=context.get('forloop',{})
            for index,item in enumerate(items):
                bindings={node['vars'][0]:item} if len(node['vars'])==1 else dict(zip(node['vars'],item))
                bindings['forloop']={'counter':index+1,'counter0':index,'revcounter':len(items)-index,
                    'revcounter0':len(items)-index-1,'first':index==0,'last':index==len(items)-1,'parentloop':parent}
                with context.push(bindings):rows.append(project(node['body'],context))
            result[node['key']]=rows
            if not items:result.update(project(node.get('empty',[]),context))
        elif kind=='with':
            bindings={key:value(expr,context) for key,expr in node['bindings'].items()}
            with context.push(bindings):result.update(project(node['body'],context))
        elif kind=='include':
            name=str(value(node['expr'],context)).removesuffix('.html')
            if name not in contracts():raise ValueError(f'Unknown data partial: {name}')
            bindings={key:value(expr,context) for key,expr in node['bindings'].items()}
            child=context.new(bindings) if node.get('only') else context
            with child.push(bindings):data=project(contracts()[name]['body'],child)
            result[node['key']]={'page':name,'data':data}
        elif kind=='ratio':
            try:result[node['key']]=str(round(float(value(node['args'][0],context))/float(value(node['args'][1],context))*float(value(node['args'][2],context))))
            except (ValueError,TypeError,ZeroDivisionError):result[node['key']]='0'
        elif kind=='url':
            result[node['key']]=reverse(str(value(node['args'][0],context)),args=[value(arg,context) for arg in node['args'][1:]])
        elif kind=='static':
            # Retained only for data-image paths, never page scripts or styles.
            from django.templatetags.static import static
            result[node['key']]=static(str(value(node['expr'],context)))
        else:raise ValueError(f'Unknown projection kind: {kind}')
    return result


def page(request, template_name, context=None, **kwargs):
    """Existing domain views now return a typed JSON page response."""
    from .api_state import build_state
    name=template_name.removesuffix('.html')
    ctx={**ui(request),'request':request,'user':request.user,'csrf_token':get_token(request),**(context or {})}
    ctx['messages']=get_messages(request)
    state=build_state(ctx)
    contract=contracts().get(name)
    data={}
    if contract:
        server_context=Context(ctx,autoescape=False,use_l10n=False)
        data=project(contract['body']+contract.get('title',[]),server_context)
    if 'fault_hints' in ctx:data['faultHints']=ctx['fault_hints']
    return JsonResponse({'page':name,'state':state,'data':data},status=kwargs.get('status',200),json_dumps_params={'ensure_ascii':False})


def session(request):
    from .api_state import build_state
    ctx={**ui(request),'request':request,'user':request.user,'messages':get_messages(request)}
    return JsonResponse({'state':build_state(ctx)},json_dumps_params={'ensure_ascii':False})


@require_http_methods(['GET','POST'])
def dispatch(request, path=''):
    """Same-origin API adapter, preserving the existing authorization decorators."""
    allowed=('', 'app/','portal/','doc/','login/','otp/','logout/','enquire/','claim/','share/','demo/','notifications/')
    if path and not path.startswith(allowed[1:]):
        return JsonResponse({'error':'This page is unavailable.'},status=404)
    target='/'+path
    request.path=request.path_info=target
    try:
        match=resolve(target)
        request.resolver_match=match
        response=match.func(request,*match.args,**match.kwargs)
    except Http404:
        return JsonResponse({'error':'This record or page is unavailable.'},status=404)
    except PermissionDenied:
        return JsonResponse({'error':'You do not have permission for this action.'},status=403)
    if 300<=response.status_code<400:
        location=response.get('Location','/')
        parsed=urlsplit(location)
        if parsed.scheme or parsed.netloc:
            if parsed.netloc!=request.get_host():return JsonResponse({'error':'Invalid redirect destination.'},status=400)
            location=parsed.path+('?' + parsed.query if parsed.query else '')
        return JsonResponse({'redirect':location,'messages':[{'text':str(m),'level':m.tags} for m in get_messages(request)]},json_dumps_params={'ensure_ascii':False})
    if response.status_code >= 400 and not response.get('Content-Type','').startswith('application/json'):
        result=JsonResponse({'error': 'This action is unavailable.' if response.status_code==405 else 'This request could not be completed.'},status=response.status_code)
        if response.has_header('Allow'):result['Allow']=response['Allow']
        return result
    return response


def csrf_failure(request,reason=''):
    return JsonResponse({'error':'Your session needs refreshing. Reload the page and try again.'},status=403)


@require_http_methods(['GET','POST'])
def business_settings(request):
    from . import config
    from django.db import transaction
    from .api_state import build_state
    if not request.user.is_authenticated or request.user.role!='director':raise PermissionDenied()
    if request.method=='POST':
        changes={}
        try:
            for key,default in config.DEFAULTS.items():
                if key not in request.POST:continue
                raw=request.POST[key]
                if isinstance(default,dict):
                    parsed=json.loads(raw)
                    if not isinstance(parsed,dict) or set(parsed)!=set(default) or any(type(v) not in (int,float) or not math.isfinite(v) or v<0 for v in parsed.values()):raise ValueError('Invalid subsidy table.')
                elif isinstance(default,(int,float)):
                    parsed=float(raw) if isinstance(default,float) else int(raw)
                    if not math.isfinite(parsed) or parsed<0 or (key.endswith('_pct') and parsed>100):raise ValueError(f'Invalid value for {key}.')
                else:parsed=raw.strip()
                changes[key]=parsed
        except (ValueError,TypeError) as error:
            messages.error(request,str(error))
        else:
            with transaction.atomic():
                for key,value_ in changes.items():config.set_value(key,value_)
            messages.success(request,'Business settings saved.')
    ctx={**ui(request),'request':request,'user':request.user,'messages':get_messages(request)}
    return JsonResponse({'page':'settings','state':build_state(ctx),'data':{'values':{key:config.get(key) for key in config.DEFAULTS}}},json_dumps_params={'ensure_ascii':False})
