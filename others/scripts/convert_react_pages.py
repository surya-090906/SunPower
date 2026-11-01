"""One-time migration: author native JSX pages and explicit JSON data projections.

The generated JSX is normal frontend source. Neither Vite nor Django reads the
archived HTML templates at runtime. Contracts contain data expressions only,
never markup. Conditional projections do not disclose hidden branches.
"""
import html
import json
import re
from pathlib import Path
from django.utils.text import smart_split

ROOT=Path.cwd()
SOURCE=ROOT/'others/legacy-frontend/templates'
DEST=ROOT/'frontend/src/pages/generated'
CONTRACTS={}
VOID={'input','br','hr','img','link','meta','source','area','col','embed','param','wbr'}
ATTRS={'class':'className','for':'htmlFor','tabindex':'tabIndex','readonly':'readOnly','maxlength':'maxLength',
       'minlength':'minLength','inputmode':'inputMode','autocomplete':'autoComplete','colspan':'colSpan',
       'rowspan':'rowSpan','autofocus':'autoFocus','viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio',
       'stroke-width':'strokeWidth','stroke-dasharray':'strokeDasharray','text-anchor':'textAnchor',
       'font-size':'fontSize','font-weight':'fontWeight','fill-opacity':'fillOpacity','frameborder':'frameBorder'}

def directive(s): return s[2:-2].strip()
def words(s): return list(smart_split(s))

def tokens(source):
    out=[];i=0
    while i<len(source):
        if source.startswith('{{',i) or source.startswith('{%',i):
            end='}}' if source[i+1]=='{' else '%}'
            j=source.index(end,i)+2;out.append(('var' if end=='}}' else 'cmd',source[i:j]));i=j
        elif source[i]=='<' and re.match(r'</?[A-Za-z!]',source[i:]):
            if source.startswith('<!--',i): i=source.index('-->',i)+3;continue
            j=i+1;quote=None
            while j<len(source):
                if source.startswith('{{',j) or source.startswith('{%',j):
                    end='}}' if source[j+1]=='{' else '%}';j=source.index(end,j)+2;continue
                c=source[j]
                if quote:
                    if c==quote:quote=None
                elif c in '\"\'':quote=c
                elif c=='>':break
                j+=1
            out.append(('tag',source[i:j+1]));i=j+1
        else:
            j=i+1
            while j<len(source) and not source.startswith(('{{','{%'),j) and not (source[j]=='<' and re.match(r'</?[A-Za-z!]',source[j:])):j+=1
            out.append(('text',source[i:j]));i=j
    return out

def parse(items,index=0,stops=()):
    result=[]
    while index<len(items):
        kind,value=items[index]
        command=directive(value) if kind=='cmd' else ''
        verb=command.split(' ',1)[0]
        if kind=='cmd' and verb in stops:return result,index,command
        if kind=='cmd' and verb=='if':
            branches=[];condition=command[3:]
            while True:
                body,index,end=parse(items,index+1,('elif','else','endif'))
                branches.append((condition,body))
                if end.startswith('elif '):condition=end[5:];continue
                if end=='else':
                    body,index,end=parse(items,index+1,('endif',));branches.append((None,body))
                break
            result.append(('if',branches))
        elif kind=='cmd' and verb=='for':
            args=command[4:].split(' in ',1);names=[s.strip() for s in args[0].split(',')]
            expression=args[1];reverse=expression.endswith(' reversed')
            if reverse:expression=expression[:-9]
            body,index,end=parse(items,index+1,('empty','endfor'));empty=[]
            if end=='empty':empty,index,end=parse(items,index+1,('endfor',))
            result.append(('for',{'vars':names,'expr':expression,'reverse':reverse,'body':body,'empty':empty}))
        elif kind=='cmd' and verb=='with':
            bindings=dict(part.split('=',1) for part in words(command[5:]))
            body,index,end=parse(items,index+1,('endwith',))
            result.append(('with',{'bindings':bindings,'body':body}))
        elif kind=='cmd' and verb in ('endif','endfor','endwith','else','empty','elif'):
            raise ValueError(f'Unexpected {command}')
        else:result.append((kind,value))
        index+=1
    if stops:raise ValueError(f'Unclosed {stops}')
    return result,index,''

class Compiler:
    def __init__(self,name):self.name=name;self.counter=0
    def key(self,prefix='v'):
        self.counter+=1;return f'{prefix}{self.counter}'
    def expression(self,expr,scope,schema):
        key=self.key();schema.append({'kind':'value','key':key,'expr':expr})
        return f'{scope}.{key}'
    def inline(self,value,scope,schema):
        ast=parse(tokens(value))[0]
        def compile_part(nodes):
            expressions=[]
            for kind,item in nodes:
                if kind=='text':expressions.append(json.dumps(html.unescape(item),ensure_ascii=False))
                elif kind=='var':expressions.append(f'text({self.expression(item[2:-2].strip(),scope,schema)})')
                elif kind=='if':
                    key=self.key('choice');children=[];result='""'
                    for cond,body in item:
                        nested=[];saved=schema[:];code=self.inline_nodes(body,scope,nested)
                        children.append({'condition':cond,'body':nested,'code':code})
                    schema.append({'kind':'if','key':key,'branches':[{k:v for k,v in b.items() if k!='code'} for b in children]})
                    for i,b in reversed(list(enumerate(children))):result=f'({scope}.{key} === {i} ? {b["code"]} : {result})'
                    expressions.append(result)
                elif kind=='cmd' and directive(item).startswith(('widthratio ','url ','static ')):
                    expressions.append(f'text({self.command_value(directive(item),scope,schema)})')
                else:raise ValueError(f'Unsupported inline {kind} {item}')
            return ' + '.join(expressions) or '""'
        return compile_part(ast)
    def inline_nodes(self,nodes,scope,schema):
        # Reconstruct only attribute text; markup is never in a contract.
        source=''
        for kind,item in nodes:
            if kind in ('text','var','cmd'):source+=item
            elif kind=='if':
                for i,(condition,body) in enumerate(item):
                    source+=('{% '+('if ' if i==0 else 'elif ')+condition+' %}') if condition else '{% else %}'
                    source+=self.reconstruct(body)
                source+='{% endif %}'
            else:raise ValueError('Unsupported attribute node')
        return self.inline(source,scope,schema)
    def reconstruct(self,nodes):
        out=''
        for kind,item in nodes:
            if kind in ('text','var','cmd','tag'):out+=item
            else:raise ValueError('Nested attribute control needs normalization')
        return out
    def command_value(self,command,scope,schema):
        parts=words(command);key=self.key()
        if parts[0]=='widthratio':schema.append({'kind':'ratio','key':key,'args':parts[1:]})
        elif parts[0]=='url':schema.append({'kind':'url','key':key,'args':parts[1:]})
        elif parts[0]=='static':schema.append({'kind':'static','key':key,'expr':parts[1]})
        else:raise ValueError(command)
        return f'{scope}.{key}'
    def attrs(self,raw,scope,schema):
        # Conditional attributes are expanded to React object spreads.
        result=[];i=0
        while i<len(raw):
            if raw[i].isspace() or raw[i]=='/':i+=1;continue
            if raw.startswith('{%',i):
                start=i;depth=0
                while i<len(raw):
                    if raw.startswith('{%',i):
                        j=raw.index('%}',i)+2;cmd=directive(raw[i:j]);verb=cmd.split()[0]
                        if verb=='if':depth+=1
                        if verb=='endif':depth-=1
                        i=j
                        if depth==0:break
                    else:i+=1
                ast=parse(tokens(raw[start:i]))[0]
                if len(ast)!=1 or ast[0][0]!='if':raise ValueError(raw[start:i])
                key=self.key('attr');branches=[];codes=[]
                for condition,nodes in ast[0][1]:
                    nested=[];code=self.attrs(self.reconstruct(nodes),scope,nested)
                    branches.append({'condition':condition,'body':nested});codes.append(code)
                schema.append({'kind':'if','key':key,'branches':branches})
                for n,code in enumerate(codes):
                    result.append(f'{{...({scope}.{key} === {n} ? {{{", ".join(self.props_object(code))}}} : {{}})}}')
                continue
            match=re.match(r'[^\s=/>]+',raw[i:])
            if not match:raise ValueError(f'Bad attribute {raw[i:]}')
            name=match.group();i+=len(name)
            while i<len(raw) and raw[i].isspace():i+=1
            value=None
            if i<len(raw) and raw[i]=='=':
                i+=1
                while raw[i].isspace():i+=1
                quote=raw[i] if raw[i] in '\"\'' else None
                if quote:
                    i+=1;start=i
                    while i<len(raw):
                        if raw.startswith(('{{','{%'),i):
                            end='}}' if raw[i+1]=='{' else '%}';i=raw.index(end,i)+2;continue
                        if raw[i]==quote:break
                        i+=1
                    value=raw[start:i];i+=1
                else:
                    start=i
                    while i<len(raw) and not raw[i].isspace():i+=1
                    value=raw[start:i]
            if name.startswith('on'):
                if name=='onclick' and value=='window.print()':result.append('onClick={() => window.print()}')
                else:raise ValueError(f'Inline handler not migrated: {name}')
                continue
            if name=='data-csrf':continue
            if name=='data-autofocus':
                result.append('autoFocus={true}')
                continue
            mapped=ATTRS.get(name,name)
            expression='true' if value is None else self.inline(value,scope,schema)
            if name=='style':expression=f'cssStyle({expression})'
            result.append(f'{mapped}={{{expression}}}')
        return result
    def props_object(self,props):
        for prop in props:
            if prop.startswith('{...'):raise ValueError('Nested conditional attributes')
            name,expression=prop.split('=',1)
            yield f'{json.dumps(name)}: {expression[1:-1]}'
    def compile(self,nodes,scope='data',schema=None):
        if schema is None:schema=[]
        output=[]
        for kind,item in nodes:
            if kind=='text':
                if item:output.append('{'+json.dumps(html.unescape(item),ensure_ascii=False)+'}')
            elif kind=='var':output.append('{'+self.expression(item[2:-2].strip(),scope,schema)+'}')
            elif kind=='tag':
                if item.startswith('<!'):continue
                closing=item.startswith('</');tag=re.match(r'</?([\w-]+)',item).group(1)
                mapped={'input':'Field','textarea':'TextArea','select':'SelectField','form':'ActionForm'}.get(tag,tag)
                if closing:output.append(f'</{mapped}>');continue
                attrs=self.attrs(item[len(tag)+1:-1],scope,schema)
                # All generated controls are React-owned; runtime supplies field tools.
                if tag=='div' and 'data-sigpad' in item:mapped='SignaturePad'
                elif tag=='div' and 'data-uploader' in item:mapped='PhotoUploader'
                elif tag=='div' and 'data-serials' in item:mapped='SerialFields'
                elif tag=='div' and 'data-kind=' in item and 'upload-tile' in item:mapped='UploadTile'
                elif tag=='label' and 'upload-tile' in item:mapped='UploadTile'
                elif tag=='div' and 'class="step"' in item:mapped='WizardStep'
                elif tag=='div' and 'class="wiz-head"' in item:mapped='WizardHead'
                elif tag=='button' and ('data-next' in item or 'data-prev' in item):mapped='WizardButton'
                elif tag=='button' and 'data-geo' in item:mapped='GeoButton'
                elif tag=='span' and 'data-geo-out' in item:mapped='GeoStatus'
                elif tag=='span' and 'data-photo-count' in item:mapped='PhotoCount'
                elif tag=='div' and 'id="code-hint-box"' in item:mapped='FaultHint'
                elif tag=='div' and re.search(r'class="field(?:\s|")',item):mapped='FieldGroup'
                # Mark renamed non-void tags for a final balanced closing-tag pass.
                output.append(f'<{mapped} {" ".join(attrs)}'+('/>' if tag in VOID or item.endswith('/>') else '>'))
                self.stack.append((tag,mapped)) if tag not in VOID and not item.endswith('/>') else None
            elif kind=='if':
                key=self.key('choice');branches=[];parts=[]
                for condition,body in item:
                    nested=[];code=self.compile(body,scope,nested);branches.append({'condition':condition,'body':nested});parts.append(code)
                schema.append({'kind':'if','key':key,'branches':branches})
                output.append('{'+''.join(f'{scope}.{key} === {n} ? <>{code}</> : ' for n,code in enumerate(parts))+'null}')
            elif kind=='for':
                key=self.key('rows');row=f'row{self.counter}';nested=[];empty_schema=[]
                body=self.compile(item['body'],row,nested);empty=self.compile(item['empty'],scope,empty_schema)
                schema.append({'kind':'for','key':key,'expr':item['expr'],'vars':item['vars'],'reverse':item['reverse'],'body':nested,'empty':empty_schema})
                output.append(f'{{{scope}.{key}?.length ? {scope}.{key}.map(({row}, index) => <Fragment key={{index}}>{body}</Fragment>) : <>{empty}</>}}')
            elif kind=='with':
                nested=[];body=self.compile(item['body'],scope,nested)
                schema.append({'kind':'with','bindings':item['bindings'],'body':nested});output.append(body)
            elif kind=='cmd':
                command=directive(item);parts=words(command);verb=parts[0]
                if verb=='csrf_token':output.append('<CsrfField />')
                elif verb=='include':
                    key=self.key('part');args={}
                    for part in parts[2:]:
                        if part in ('with','only'):continue
                        k,v=part.split('=',1);args[k]=v
                    schema.append({'kind':'include','key':key,'expr':parts[1],'bindings':args,'only':'only' in parts})
                    output.append(f'<Partial part={{{scope}.{key}}} state={{state}} />')
                elif verb in ('widthratio','url','static'):output.append('{'+self.command_value(command,scope,schema)+'}')
                else:raise ValueError(f'Unknown directive: {command}')
        return ''.join(output)

def balanced_tags(code):
    # HTML tags retain a few specialized React wrappers; match original close tags.
    pattern=re.compile(r'<(/?)([A-Za-z][\w-]*)(?:\s|>|/)')
    stack=[];replacements=[]
    originals={'Field':'input','TextArea':'textarea','SelectField':'select','ActionForm':'form','SignaturePad':'div','PhotoUploader':'div','SerialFields':'div','UploadTile':None,'WizardStep':'div','WizardHead':'div','WizardButton':'button','GeoButton':'button','GeoStatus':'span','PhotoCount':'span','FaultHint':'div','FieldGroup':'div'}
    # Use a lexical JSX scanner: attributes contain braces and strings.
    i=0
    while i<len(code):
        if code[i]!='<':i+=1;continue
        if code.startswith('<>',i) or code.startswith('</>',i):i+=2 if code[i+1]=='>' else 3;continue
        m=pattern.match(code,i)
        if not m:i+=1;continue
        closing,name=m.groups();j=m.start(2)+len(name);quote=None;depth=0
        while j<len(code):
            c=code[j]
            if quote:
                if c=='\\':j+=2;continue
                if c==quote:quote=None
            elif c in '\"\'':quote=c
            elif c=='{':depth+=1
            elif c=='}':depth-=1
            elif c=='>' and depth==0:break
            j+=1
        if closing:
            if not stack:raise ValueError(f'Unexpected close {name}')
            actual,original=stack.pop()
            if name!=original and name!=actual:raise ValueError(f'Mismatch {name}, expected {actual}/{original}')
            if name!=actual:replacements.append((i+2,i+2+len(name),actual))
        elif not code[i:j].rstrip().endswith('/'):
            original=originals.get(name,name)
            if name=='UploadTile':original='label'
            stack.append((name,original))
        i=j+1
    if stack:raise ValueError(f'Unclosed JSX {stack}')
    for start,end,value in reversed(replacements):code=code[:start]+value+code[end:]
    return code

def convert(path):
    name=path.relative_to(SOURCE).as_posix().removesuffix('.html')
    source=path.read_text(encoding='utf-8')
    source=re.sub(r'<script\b[^>]*>.*?</script>','',source,flags=re.S|re.I)
    if name=='portal/project':
        source=re.sub(r'{% if has_systems or tickets %}.*?{% endif %}', '', source, flags=re.S)
    if name=='portal/systems':source=source.replace('u.s.product.category != "panel"', 'u.can_report')
    if name=='portal/request_new':
        source=source.replace('{% csrf_token %}', '{% csrf_token %}<input type="hidden" name="project" value="{{ project_filter }}">')
        source=source.replace('You have no delivered equipment yet.', 'Report a problem becomes available after installation is complete.')
    if name=='backoffice/inventory':source=source.replace('>Pick lists</a>', '>Customer material bundles</a>')
    if name=='portal/pay':
        source=source.replace('<form method="post" class="stack">','<form method="post" action="/portal/p/{{ p.id }}/pay/" class="stack">')
        source=source.replace('name="mode" value=', 'type="submit" name="mode" value=')
    if name in ('backoffice/quick_add','backoffice/receive','backoffice/install_form'):
        source=re.sub(r'(form\.\w+)\|default:(?:\x27[^\x27]*\x27|"[^"]*"|[\w.]+)',r'\1',source)
    if name=='backoffice/quick_add':source=source.replace('if k == "3"','if form.kw == k')
    title=re.search(r'{%\s*block title\s*%}(.*?){%\s*endblock\s*%}',source,re.S)
    content=re.search(r'{%\s*block content\s*%}(.*?){%\s*endblock\s*%}',source,re.S)
    styles=[]
    if content:source=content.group(1)
    elif name=='docs/label':
        styles=re.findall(r'<style>(.*?)</style>',source,re.S)
        styles=[s.replace('body', '.asset-label-page') for s in styles]
        source='<div class="asset-label-page">'+re.search(r'<body[^>]*>(.*?)</body>',source,re.S).group(1)+'</div>'
    if name=='backoffice/quick_add':source=re.sub(r'<div class="card mb".*?(?=<form method="post")','',source,flags=re.S)
    source=re.sub(r'<table\b([^>]*)>(.*?)</table>',lambda m:'<table'+m[1]+'>'+('' if re.search(r'<(?:thead|tbody)\b',m[2]) else '<tbody>')+m[2]+('' if re.search(r'<(?:thead|tbody)\b',m[2]) else '</tbody>')+'</table>',source,flags=re.S)
    items=[];open_option=False
    for kind,item in tokens(source):
        closes=(kind=='tag' and re.match(r'<(?:option\b|/(?:select|datalist)\b)',item)) or (kind=='cmd' and directive(item)=='endfor')
        if open_option and closes:items.append(('tag','</option>'));open_option=False
        if kind=='tag' and re.match(r'<option\b',item):open_option=True
        if kind=='tag' and item.startswith('</option'):open_option=False
        items.append((kind,item))
    # React forbids even whitespace text children in table structural elements.
    clean=[];parents=[]
    for kind,item in items:
        if kind=='tag':
            match=re.match(r'<(/?)([\w-]+)',item)
            if match:
                closing,tag=match.groups()
                if closing:
                    if tag in parents:parents=parents[:len(parents)-1-parents[::-1].index(tag)]
                elif tag not in VOID and not item.endswith('/>'):parents.append(tag)
        if kind=='text' and not item.strip() and parents and parents[-1] in ('table','thead','tbody','tfoot','tr','colgroup'):continue
        clean.append((kind,item))
    items=clean
    compiler=Compiler(name);compiler.stack=[];schema=[]
    code=compiler.compile(parse(items)[0],schema=schema)
    code=balanced_tags(code)
    if styles:code='<style>{'+json.dumps('\n'.join(styles))+'}</style>'+code
    if name=='backoffice/quick_add':code='<QuickAddExtractor />'+code
    if name in ('backoffice/ticket','backoffice/ticket_new'):code='<FaultHintsProvider hints={data.faultHints || {}}>'+code+'</FaultHintsProvider>'
    title_schema=[];title_code=compiler.inline(title[1] if title else name.split('/')[-1].replace('_',' ').title(),'data',title_schema)
    CONTRACTS[name]={'body':schema,'title':title_schema,'titleExpression':title_code}
    output=DEST/(name+'.jsx');output.parent.mkdir(parents=True,exist_ok=True)
    helpers='Fragment, cssStyle, text, FieldGroup, Field, TextArea, SelectField, ActionForm, CsrfField, Partial, SignaturePad, PhotoUploader, UploadTile, PhotoCount, WizardStep, WizardHead, WizardButton, GeoButton, GeoStatus, SerialFields, QuickAddExtractor, FaultHint, FaultHintsProvider'.split(', ')
    imports=', '.join(helper for helper in helpers if re.search(r'\b'+helper+r'\b',code))
    support_import=''
    if name=='portal/project':
        support_import='import SystemSupport from "../../../components/SystemSupport";\n'
        code+='<SystemSupport support={data.support}/>'
    output.write_text(f'// Native React page. Data contract: {name}.\nimport {{ {imports} }} from "@ui/runtime";\n{support_import}export default function Page({{data, state}}) {{ return (<>{code}</>); }}\n',encoding='utf-8')

EXCLUDE={'base','backoffice/base','backoffice/home','portal/base','portal/home','public/base','public/landing','public/login','public/otp_login','public/enquire','public/_auth_nav','components/flashes','components/switcher','components/bell'}
for path in sorted(SOURCE.rglob('*.html')):
    name=path.relative_to(SOURCE).as_posix().removesuffix('.html')
    if name not in EXCLUDE:
        try:convert(path)
        except Exception as error:raise RuntimeError(f'{name}: {error}') from error
(ROOT/'backend/core/page_contracts.json').write_text(json.dumps(CONTRACTS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Converted {len(CONTRACTS)} native React pages/partials and their JSON data contracts.')
