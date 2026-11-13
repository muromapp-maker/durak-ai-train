# etiket təmizliyi: v3 ≥97% əmin olub etiketlə razılaşmırsa — avtomatik nümunə atılır (köhnə tanıma səhv yazıb)
import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np
from cnn import Net, train, predict
d = np.load('/tmp/smp1/ds/data.npz'); X, R, S, G, SRC, RM = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['RM']
def ld(f):
    n = Net(); j = json.load(open(f)); n.P = {k: np.frombuffer(base64.b64decode(v['b']), '<f2').astype(np.float32).reshape(v['sh']) for k, v in j['cn'].items()}; return n
v3 = ld('/home/claude/durak-ai/ai/models/cardnet_v3.json')
r, s, pr, ps = predict(v3, X, True)
bad = (SRC == 'auto') & ~((r == R) & (s == S)) & (np.minimum(pr, ps) >= 0.97)
print('atılan səhv etiketli avtomatik nümunə:', bad.sum(), {g: int((bad & (G == g)).sum()) for g in np.unique(G) if (bad & (G == g)).sum()}, flush=True)
K = ~bad; X, R, S, G, SRC, RM = X[K], R[K], S[K], G[K], SRC[K], RM[K]
rng = np.random.default_rng(7); z4 = G == 'zip4'; hold = z4 & (rng.random(len(X)) < 0.4)
def rep(nm, net, m):
    r, s, pr, ps = predict(net, X[m], True); ok = (r == R[m]) & (s == S[m]); c = (pr >= 0.95) & (ps >= 0.95)
    print('%s: %d/%d düz (%.1f%%) · ≥95%%: %d, səhv %d' % (nm, ok.sum(), m.sum(), 100 * ok.mean(), c.sum(), (c & ~ok).sum()), flush=True)
rep('v3 → zip-4 (təmiz, hamısı)', v3, z4); rep('v3 → zip-4 ayrılmış (təmiz)', v3, hold)
net = train(X[~hold], R[~hold], S[~hold], epochs=30, seed=5, wsamp=np.where(SRC[~hold] == 'user', 5.0, 1.0), RM=RM[~hold])
rep('v4 → zip-4 ayrılmış (təmiz)', net, hold)
fin = train(X, R, S, epochs=30, seed=6, wsamp=np.where(SRC == 'user', 5.0, 1.0), RM=RM)
r, s = predict(fin, X); print('v4 son: hamısında %.2f%%' % (100 * ((r == R) & (s == S)).mean()), flush=True)
cn = {k: {'sh': list(v.shape), 'b': base64.b64encode(v.astype('<f2').tobytes()).decode()} for k, v in fin.P.items()}
json.dump({'meta': {'n': int(len(X)), 'in': [48, 36], 'ranks': '2 3 4 5 6 7 8 9 10 J Q K A', 'suits': 'shdc', 'v': 4, 'mask': 1, 'clean': int(bad.sum())}, 'cn': cn}, open('/tmp/smp1/cardnet_v4.json', 'w'))
print('ok', flush=True)
