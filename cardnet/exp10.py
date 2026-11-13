# v8: + zip7 + tərs (180°) kart küncləri "kart deyil" (14-cü sinif) — əldə başqa kartın alt küncü tərs görünür
import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np, cnn
from cnn import Net, train, predict
d = np.load('/tmp/smp1/ds/data7.npz'); X, R, S, G, SRC, RM = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['RM']
def ld(f):
    j = json.load(open(f)); P = {k: np.frombuffer(base64.b64decode(v['b']), '<f2').astype(np.float32).reshape(v['sh']) for k, v in j['cn'].items()}
    n = Net(0, P['br'].shape[0]); n.P = P; return n
v6 = ld('/home/claude/durak-ai/ai/models/cardnet_v6.json')
pos = R < 13
r, s, pr, ps = predict(v6, X, True)
bad = pos & (SRC == 'auto') & ~((r == R) & (s == S)) & (np.minimum(pr, ps) >= 0.97)
print('atılan səhv etiketli avtomatik nümunə:', int(bad.sum()), flush=True)
K = ~bad; X, R, S, G, SRC, RM = X[K], R[K], S[K], G[K], SRC[K], RM[K]
rng = np.random.default_rng(9)
# tərs künclər: kart nümunələrinin 180° çevrilmişi
pi = np.where(R < 13)[0]; sel = rng.choice(pi, size=min(1800, len(pi)), replace=False)
XR = X[sel][:, ::-1, ::-1, :].copy()
# real tərs künc: indeks öz yerindədir, amma başıaşağı (rəng yuxarıda, dəyər altında) — yalnız sol indeks blokunu 180° çevir
sel2 = rng.choice(pi, size=min(2400, len(pi)), replace=False); XB = X[sel2].copy()
for k in range(len(XB)):
    y0, y1, x1 = rng.integers(1, 5), rng.integers(42, 48), rng.integers(18, 27)
    XB[k, y0:y1, 0:x1] = XB[k, y0:y1, 0:x1][::-1, ::-1]
XR = np.concatenate([XR, XB])
X = np.concatenate([X, XR]); R = np.concatenate([R, np.full(len(XR), 13)]); S = np.concatenate([S, np.zeros(len(XR), int)])
G = np.concatenate([G, np.array(['rot'] * len(XR))]); SRC = np.concatenate([SRC, np.array(['rot'] * len(XR))]); RM = np.concatenate([RM, np.full(len(XR), 22)])
z7 = G == 'zip7'; uXa = z7 & (R == 13) & (SRC == 'user'); ix = np.where(uXa)[0]; uX = np.zeros(len(X), bool); uX[ix[::2]] = True; rot = G == 'rot'; neg = (R == 13) & ~rot & ~uX
hold = (z7 & (rng.random(len(X)) < 0.4)) | uX | (rot & (rng.random(len(X)) < 0.3)) | (neg & (rng.random(len(X)) < 0.3))
def rep(nm, net, m):
    r, s, pr, ps = predict(net, X[m], True); isX = r == 13; ok = (r == R[m]) & ((s == S[m]) | (R[m] == 13)); c = (pr >= 0.95) & ((ps >= 0.95) | isX)
    print('%-34s %4d/%4d düz (%.1f%%) · ≥95%%: %d, onlardan səhv %d' % (nm, ok.sum(), m.sum(), 100 * ok.mean(), c.sum(), (c & ~ok).sum()), flush=True)
A = hold & z7 & (R < 13)
for nm, m in (('zip7 ayrılmış kartlar', A), ('sənin "kart deyil" (ayrılmış)', uX), ('tərs künclər (ayrılmış)', hold & rot), ('digər kart-deyil (ayrılmış)', hold & neg)): rep('v6 → ' + nm, v6, m)
cnn.SYN = X[~hold & (R < 13)]
net = train(X[~hold], R[~hold], S[~hold], epochs=30, seed=5, wsamp=np.where(uXa[~hold], 15.0, np.where(SRC[~hold] == 'user', 5.0, 1.0)), RM=RM[~hold], nr=14)
for nm, m in (('zip7 ayrılmış kartlar', A), ('sənin "kart deyil" (ayrılmış)', uX), ('tərs künclər (ayrılmış)', hold & rot), ('digər kart-deyil (ayrılmış)', hold & neg)): rep('v8 → ' + nm, net, m)
cnn.SYN = X[R < 13]
fin = train(X, R, S, epochs=30, seed=6, wsamp=np.where(uXa, 15.0, np.where(SRC == 'user', 5.0, 1.0)), RM=RM, nr=14)
r, s = predict(fin, X); print('v8 son: hamısında %.2f%%' % (100 * ((r == R) & ((s == S) | (R == 13))).mean()), flush=True)
cn = {k: {'sh': list(v.shape), 'b': base64.b64encode(v.astype('<f2').tobytes()).decode()} for k, v in fin.P.items()}
json.dump({'meta': {'n': int(len(X)), 'in': [48, 36], 'ranks': '2 3 4 5 6 7 8 9 10 J Q K A X', 'suits': 'shdc', 'v': 8, 'mask': 1, 'syn': 1, 'none': 1, 'rot': 1}, 'cn': cn}, open('/tmp/smp1/cardnet_v8b.json', 'w'))
print('ok', flush=True)
