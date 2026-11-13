# Bütün nümunələri bir yerə: zip (auto/user) + truth ekran görüntülərindən kəsilmiş kartlar → ds/data7.npz
import json, csv, struct, numpy as np
from PIL import Image
RAW = '/home/claude/durak-ai/samples/raw/'
RS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']; SU = 'shdc'
H, W = 48, 36
def norm(im):  # hündürlük 48, en mütənasib, sağdan boz doldurma / kəsmə (rəqəm solda)
    im = im.convert('RGB'); w = max(1, round(im.width * H / im.height)); im = im.resize((w, H), Image.BILINEAR)
    a = np.full((H, W, 3), 128, np.uint8); a[:, :min(W, w)] = np.asarray(im)[:, :W]; return a
def lab(l): return (13, 0) if l == 'X' else (RS.index(l[:-1]), SU.index(l[-1]))
X, R, S, G, SRC, CUT, RM = [], [], [], [], [], [], []
def rmin(w, h):  # sağ qonşu maskası ən tez bu sütundan başlaya bilər (48-lik şəkildə): o.x+o.w+0.05H
    H_ = h / 2.2; ow = max(0.3 * H_, w - 0.7 * H_); return int(min(35, round((0.4 * H_ + ow) * 48 / h)))
for ZD in ('/tmp/smp1/x/', '/tmp/smp2/x/', '/tmp/smp3/x/', '/tmp/smp4/x/', '/tmp/smp5/x/', '/tmp/smp6/x/', '/tmp/smp7/x/'):
    for x in csv.DictReader(open(ZD + 'labels.csv')):
        r, s = lab(x['label']); X.append(norm(Image.open(ZD + x['file']))); R.append(r); S.append(s)
        G.append('zip' + ZD[8]); SRC.append(x['src']); CUT.append(int(x['cut']))
        bx = (x.get('box') or '').split(); RM.append(rmin(float(bx[2]), float(bx[3])) if len(bx) == 4 else 22)
cache = {}
for i, b in enumerate(json.load(open('/tmp/smp1/truthboxes.json'))):
    n = b['img']
    if n not in cache:
        d = open(RAW + n + '.rgba', 'rb').read(); w, h = struct.unpack('<II', d[:8])
        cache[n] = Image.frombytes('RGBA', (w, h), d[8:8 + w * h * 4])
    im = cache[n]; x, y, w, h, cut = b['b']; Hh = h
    x0, y0 = max(0, x - 0.35 * Hh), max(0, y - 0.25 * Hh); ww, hh = min(im.width - x0, w + 0.7 * Hh), min(im.height - y0, 2.2 * Hh)
    cr = im.crop((round(x0), round(y0), round(x0 + ww), round(y0 + hh)))
    if i < 40: cr.save('/tmp/smp1/ds/t%03d_%s.png' % (i, b['l']))
    r, s = lab(b['l']); X.append(norm(cr)); R.append(r); S.append(s); G.append('scr:' + n); SRC.append('truth'); CUT.append(cut); RM.append(rmin(ww, hh))
# KART DEYİL (sinif 13): ekran şəkillərində kartın içindən (rəqəmsiz) kəsimlər — ləkə / şəkil / xallar
NEG = 0
for b in json.load(open('/tmp/smp1/truthboxes.json')):
    im = cache[b['img']]; x, y, w, h, cut = b['b']; Hh = h
    offs = [(0.9, 0.0), (0.0, 1.15), (0.9, 1.1), (0.5, 1.6)] if b['w'] != 'h' else [(0.0, 1.15)]
    for dx, dy in offs:
        xx, yy = x + dx * Hh, y + dy * Hh
        x0, y0 = max(0, xx - 0.35 * Hh), max(0, yy - 0.25 * Hh); ww, hh = min(im.width - x0, w + 0.7 * Hh), min(im.height - y0, 2.2 * Hh)
        if ww < 8 or hh < 1.5 * Hh: continue
        cr = im.crop((round(x0), round(y0), round(x0 + ww), round(y0 + hh)))
        X.append(norm(cr)); R.append(13); S.append(0); G.append('neg:' + b['img']); SRC.append('neg'); CUT.append(0); RM.append(22); NEG += 1
print('kart deyil nümunələri:', NEG)
np.savez_compressed('/tmp/smp1/ds/data7.npz', X=np.array(X), R=np.array(R), S=np.array(S), G=np.array(G), SRC=np.array(SRC), CUT=np.array(CUT), RM=np.array(RM))
print(len(X), 'nümunə', np.bincount(R, minlength=14), np.bincount(S, minlength=4), 'cut', sum(CUT))
