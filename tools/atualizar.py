"""Atualiza o catálogo da vitrine a partir da loja de origem.

Uso: python3 -I tools/atualizar.py <URL_DA_LOJA> <PASTA_DO_SITE>
Gera data.js e img/c*.json e atualiza a versão dos scripts no index.html.
Sai com erro (sem mexer no site) se o catálogo vier vazio ou muito menor.
"""
import sys, re, html, json, io, os, glob, time, base64, hashlib, subprocess, tempfile
from collections import OrderedDict, defaultdict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

BASE = sys.argv[1].rstrip('/')
SITE = os.path.abspath(sys.argv[2])
TMP = tempfile.mkdtemp(prefix='vitrine_')

def get(url, path):
    for _ in range(3):
        r = subprocess.run(['curl', '-sS', '-L', '-m', '60', '-o', path, url])
        if r.returncode == 0 and os.path.getsize(path) > 0:
            return True
        time.sleep(2)
    return False

# 1. baixar páginas da listagem até acabar
pages = []
def fetch_page(n):
    f = f'{TMP}/p{n}.html'
    get(f'{BASE}/produtos/page/{n}/', f)
    return n, f
n = 1
while True:
    batch = list(range(n, n + 12))
    with ThreadPoolExecutor(8) as ex:
        res = sorted(ex.map(fetch_page, batch))
    empty = 0
    for k, f in res:
        t = open(f, encoding='utf-8', errors='ignore').read() if os.path.exists(f) else ''
        if 'data-component="product-list-item"' in t:
            pages.append(f)
        else:
            empty += 1
    if empty:
        break
    n += 12
    if n > 600:
        break

# 2. ler produtos e variações
items = {}; order = []
for f in pages:
    t = open(f, encoding='utf-8', errors='ignore').read()
    NM = {m.group(1): m.group(2) for m in re.finditer(r'data-store="product-item-name-(\d+)">\s*([^<]+)', t)}
    for b in re.split(r'(?=<div class="js-item-product)', t)[1:]:
        b = b[:200000]
        pid = re.search(r'data-product-id="(\d+)"', b)
        v = re.search(r'data-variants="([^"]*)"', b)
        if not pid or not v:
            continue
        pid = pid.group(1)
        if pid in items:
            continue
        vs = json.loads(html.unescape(v.group(1)))
        url = re.search(r'href="(https?://[^"]+/produtos/[^"]+)"', b)
        img = re.search(r'(//[^" ,]+/stores/[^" ,]+?\.webp)', b)
        items[pid] = {'name': html.unescape(NM.get(pid, '').strip()), 'url': url.group(1) if url else '', 'img': img.group(1) if img else '',
                      'vars': [{'o0': x.get('option0'), 'o1': x.get('option1'), 'price': x.get('price_number'), 'stock': x.get('stock'), 'av': x.get('available'), 'img': x.get('image_url')} for x in vs]}
        order.append(pid)

# 3. categorias e variações com estoque
pref = {'ank': 'Anéis', 'ak': 'Anéis', 'brk': 'Brincos', 'bk': 'Brincos', 'clk': 'Colares', 'plk': 'Pulseiras', 'pjk': 'Pingentes', 'cjk': 'Conjuntos'}
kw = [('BERLOQUE', 'Berloques'), ('CONJUNTO', 'Conjuntos'), ('TRIO', 'Brincos'), ('ALIANÇA', 'Anéis'), ('ANEL', 'Anéis'), ('BRINCO', 'Brincos'), ('ESCAPUL', 'Colares'), ('COLAR', 'Colares'), ('CHOKER', 'Colares'), ('PULSEIRA', 'Pulseiras'), ('TORNOZELEIRA', 'Pulseiras'), ('PINGENTE', 'Pingentes')]
bad = ('CAIXA PARA', 'PEGA LADR', 'CONTRA ARGOLA')
small = {'de', 'com', 'da', 'do', 'e', 'sem', 'das', 'dos', 'em', 'a', 'o', 'para'}
def clean(n):
    n = re.sub(r'^[A-Z]{1,3}\s+[\d/]+\s*(?:[A-Z]\s+)?', '', n)
    w = []
    for k, x in enumerate(n.lower().split()):
        if re.search(r'\d', x) or (k > 0 and x in small): w.append(x)
        else: w.append(x[:1].upper() + x[1:])
    return ' '.join(w)
def colorname(c):
    c = (c or '').strip()
    if not c or c == '.' or re.search(r'\d', c): return ''
    return c.title().replace('Sem Zirconia', 'Sem Zircônia')
def big(u):
    return 'https:' + re.sub(r'-\d+-\d+\.webp$', '-480-0.webp', u) if u else ''
bycat = OrderedDict()
for pid in order:
    i = items[pid]
    if not i['name'] or any(x in i['name'] for x in bad): continue
    m = re.search(r'/produtos/([a-z]+)-(\d+)', i['url'])
    c = pref.get(m.group(1)) if m else None
    if not c:
        for k, v in kw:
            if k in i['name']: c = v; break
    if not c: continue
    av = [v for v in i['vars'] if v['av'] and (v['stock'] is None or v['stock'] > 0)]
    if not av: continue
    colors = OrderedDict()
    for v in av:
        cn = colorname(v['o0'])
        o1 = (v['o1'] or '').strip().upper()
        lm = re.fullmatch(r'LETRA\s+([A-Z])', o1)
        size = o1 if re.fullmatch(r'\d{1,2}', o1) and o1 != '00' else ('Letra ' + lm.group(1) if lm else '')
        if cn not in colors: colors[cn] = {'c': cn, 'price': v['price'], 'img': big(v['img']) or big(i['img']), 'sizes': []}
        if lm: colors[cn]['ot'] = 'Letra'
        if size and size not in colors[cn]['sizes']: colors[cn]['sizes'].append(size)
    for cc in colors.values():
        if not cc['img']: cc['img'] = big(i['img'])
        cc['sizes'].sort(key=lambda x: (0, int(x)) if x.isdigit() else (1, x))
    bycat.setdefault(c, []).append({'ref': (m.group(1).upper() + ' ' + m.group(2)) if m else '', 'name': clean(i['name']), 'cat': c, 'colors': list(colors.values())})

lists = [list(l) for l in bycat.values()]
sel = []
while any(lists):
    for l in lists:
        if l: sel.append(l.pop(0))

# trava de segurança: não publica catálogo quebrado
old = 0
try:
    old = len(json.loads(open(f'{SITE}/data.js', encoding='utf-8').read()[len('window.P='):].rstrip(';\n')))
except Exception:
    pass
if len(sel) < 100 or (old and len(sel) < old * 0.6):
    print(f'ABORTADO: catálogo novo tem {len(sel)} peças (antes {old}).'); sys.exit(2)

# 4. fotos
urls = sorted({c['img'] for p in sel for c in p['colors'] if c['img']})
os.makedirs(f'{TMP}/img', exist_ok=True)
def dl(u):
    f = f'{TMP}/img/' + hashlib.md5(u.encode()).hexdigest()[:16] + '.webp'
    if not os.path.exists(f): get(u, f)
    return u, f
with ThreadPoolExecutor(16) as ex:
    files = dict(ex.map(dl, urls))
CH = 40; chunks = defaultdict(dict); keymap = {}; badimg = 0
for i, p in enumerate(sel):
    for c in p['colors']:
        u = c.pop('img')
        h = hashlib.md5(u.encode()).hexdigest()[:16]
        if u not in keymap:
            keymap[u] = (h, i // CH)
            try:
                im = Image.open(files[u]).convert('RGB'); im.thumbnail((320, 320)); b = io.BytesIO(); im.save(b, 'WEBP', quality=66)
                chunks[i // CH][h] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
            except Exception:
                badimg += 1
        c['k'], c['ch'] = keymap[u]

# 5. gravar no site
for f in glob.glob(f'{SITE}/img/c*.json'): os.remove(f)
os.makedirs(f'{SITE}/img', exist_ok=True)
for k, d in chunks.items():
    json.dump(d, open(f'{SITE}/img/c{k}.json', 'w'))
open(f'{SITE}/data.js', 'w', encoding='utf-8').write('window.P=' + json.dumps(sel, ensure_ascii=False, separators=(',', ':')) + ';')
idx = open(f'{SITE}/index.html', encoding='utf-8').read()
idx = re.sub(r'(src="(?:lojas|data|vitrine)\.js)(?:\?v=\d+)?"', r'\g<1>?v=' + str(int(time.time())) + '"', idx)
open(f'{SITE}/index.html', 'w', encoding='utf-8').write(idx)
cnt = defaultdict(int)
for p in sel: cnt[p['cat']] += 1
print(f'OK: {len(sel)} peças (antes {old}), {len(urls)} fotos, {badimg} fotos com erro. ' + ', '.join(f'{k}: {v}' for k, v in cnt.items()))
