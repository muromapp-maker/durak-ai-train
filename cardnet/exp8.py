# v7: + zip6 + "kart deyil" sinfi (14-cü); etiket təmizliyi v5 ilə
import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np, cnn
from cnn import Net, train, predict
d = np.load('/tmp/smp1/ds/data.npz'); X, R, S, G, SRC, RM = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['RM']
def ld(f):
    j = json.load(open(f)); P = {k: np.frombuffer(base64.b64decode(v['b']), '<f2').astype(np.float32).reshape(v['sh']) for k, v in j['cn'].items()}
    n = Net(0, P['br'].shape[0]); n.P = P; return n
v6old = ld('/home/claude/durak-ai/ai/models/cardnet_v6.json')
pos = R < 13
r, s, pr, ps = predict(v6old, X, True)
bad = pos & (SRC == 'auto') & ~((r == R) & (s == S)) & (np.minimum(pr, ps) >= 0.97)
print('atılan səhv etiketli avtomatik nümunə:', int(bad.sum()), flush=True)
K = ~bad; X, R, S, G, SRC, RM = X[K], R[K], S[K], G[K], SRC[K], RM[K]
rng = np.random.default_rng(7); z5 = G == 'zip6'; neg = R == 13
hold = (z5 & (rng.random(len(X)) < 0.4)) | (neg & (rng.random(len(X)) < 0.3))
hp, hn = hold & (R < 13), hold & neg
def rep(nm, net, m):
    r, s, pr, ps = predict(net, X[m], True); isX = r == 13; ok = (r == R[m]) & ((s == S[m]) | (R[m] == 13)); c = (pr >= 0.95) & ((ps >= 0.95) | isX)
    print('%s: %d/%d düz (%.1f%%) · ≥95%%: %d, səhv %d · "kart deyil" dedi: %d' % (nm, ok.sum(), m.sum(), 100 * ok.mean(), c.sum(), (c & ~ok).sum(), isX.sum()), flush=True)
rep('v6 → zip-6 ayrılmış kartlar', v6old, hp)
r5 = predict(v6old, X[hn], True); print('v6 → kart olmayan %d şəkil: ≥95%% əminliklə kart dedi: %d' % (hn.sum(), int(((r5[2] >= 0.95) & (r5[3] >= 0.95)).sum())), flush=True)
cnn.SYN = X[~hold & (R < 13)]
net = train(X[~hold], R[~hold], S[~hold], epochs=30, seed=5, wsamp=np.where(SRC[~hold] == 'user', 5.0, 1.0), RM=RM[~hold], nr=14)
rep('v7 → zip-6 ayrılmış kartlar', net, hp); rep('v7 → kart olmayan şəkillər', net, hn); rep('v6 → kart olmayan şəkillər', v6old, hn)
cnn.SYN = X[R < 13]
fin = train(X, R, S, epochs=30, seed=6, wsamp=np.where(SRC == 'user', 5.0, 1.0), RM=RM, nr=14)
r, s = predict(fin, X); print('v7 son: hamısında %.2f%%' % (100 * ((r == R) & ((s == S) | (R == 13))).mean()), flush=True)
cn = {k: {'sh': list(v.shape), 'b': base64.b64encode(v.astype('<f2').tobytes()).decode()} for k, v in fin.P.items()}
json.dump({'meta': {'n': int(len(X)), 'in': [48, 36], 'ranks': '2 3 4 5 6 7 8 9 10 J Q K A X', 'suits': 'shdc', 'v': 7, 'mask': 1, 'syn': 1, 'none': 1}, 'cn': cn}, open('/tmp/smp1/cardnet_v7.json', 'w'))
print('ok', flush=True)
