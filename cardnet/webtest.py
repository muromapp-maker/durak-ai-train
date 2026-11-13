import json, struct, base64, io, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, '/home/claude/durak-ai/samples')
T = json.loads(os.popen("node -e \"console.log(JSON.stringify(Object.assign({},require('/home/claude/durak-ai/samples/truth.js'),require('/home/claude/durak-ai/samples/truth2.js'))))\"").read())
JS = r"""async ([b64, t]) => {
  const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + b64; });
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const r = DREC.analyze(g.getImageData(0, 0, c.width, c.height));
  const nm = (x) => x < 0 ? '??' : RS[rOf(x)] + 'shdc'[sOf(x)], out = { ok: 0, bad: [], fix: 0, fixbad: [], left: 0, wrongfix: 0, wrongbad: [] };
  const cards = [];
  if (t.hand && r.hand.length === t.hand.length) r.hand.forEach((h, i) => cards.push([t.hand[i], h, 'h']));
  if (t.table && r.table.length === t.table.length) r.table.forEach((p, i) => { cards.push([t.table[i][0], p.ca, 'a']); if (p.cd && t.table[i][1]) cards.push([t.table[i][1], p.cd, 'd']); });
  cards.forEach(([l, o]) => { const p = CNET.readCard(c, o); if (p && nm(p.c) === l) out.ok++; else out.bad.push(l + '→' + (p ? nm(p.c) + ' ' + p.pr.toFixed(2) + '/' + p.ps.toFixed(2) : 'null')); });
  // hamısı "oxunmadı" — AI bərpa edirmi
  const r2 = JSON.parse(JSON.stringify(r)); r2.hand.forEach((h) => { h.c = -1; }); r2.table.forEach((p) => { p.a = -1; if (p.cd) p.d = -1; });
  cnnFix(r2, c);
  const chk = (got, l) => { if (got < 0) out.left++; else if (nm(got) === l) out.fix++; else out.fixbad.push(l + '→' + nm(got)); };
  if (t.hand && r2.hand.length === t.hand.length) r2.hand.forEach((h, i) => chk(h.c, t.hand[i]));
  if (t.table && r2.table.length === t.table.length) r2.table.forEach((p, i) => { chk(p.a, t.table[i][0]); if (p.cd && t.table[i][1]) chk(p.d, t.table[i][1]); });
  // səhv oxunub, az əminlik (məs. Q→10): AI düzəldirmi
  const r3 = JSON.parse(JSON.stringify(r)); r3.hand.forEach((h) => { h.c = (h.c + 1) % 52; h.rm = 0.01; });
  cnnFix(r3, c);
  if (t.hand && r3.hand.length === t.hand.length) r3.hand.forEach((h, i) => { if (nm(h.c) === t.hand[i]) out.wrongfix++; else out.wrongbad.push(t.hand[i] + '→' + nm(h.c)); });
  return out;
}"""
tot = {'ok': 0, 'bad': [], 'fix': 0, 'fixbad': [], 'left': 0, 'wrongfix': 0, 'wrongbad': []}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/durak-ai/web/index.html'); pg.wait_for_timeout(800)
    for n, t in T.items():
        f = '/home/claude/durak-ai/samples/raw/' + n + '.rgba'
        if not os.path.exists(f): continue
        d = open(f, 'rb').read(); w, h = struct.unpack('<II', d[:8]); im = Image.frombytes('RGBA', (w, h), d[8:8 + w * h * 4])
        bio = io.BytesIO(); im.save(bio, 'PNG'); o = pg.evaluate(JS, [base64.b64encode(bio.getvalue()).decode(), t])
        for k in tot: tot[k] += o[k]
    print('errors', errs)
n = tot['ok'] + len(tot['bad'])
print('AI birbaşa: %d/%d düz' % (tot['ok'], n), tot['bad'][:10])
print('hamısı oxunmadı → AI: %d düz bərpa, %d səhv, %d toxunmadı' % (tot['fix'], len(tot['fixbad']), tot['left']), tot['fixbad'][:10])
print('əldə səhv oxunuş (az əminlik) → AI: %d düzəldi, %d qaldı' % (tot['wrongfix'], len(tot['wrongbad'])), tot['wrongbad'][:10])
