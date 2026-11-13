import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np
from cnn import Net, train, predict
d = np.load('ds/data.npz'); X, R, S, G, SRC, CUT = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['CUT']
rng = np.random.default_rng(7); z2 = G == 'zip2'; hold = z2 & (rng.random(len(X)) < 0.3)
v1 = Net(); j = json.load(open('/home/claude/durak-ai/ai/models/cardnet_v1.json')); v1.P = {k: np.frombuffer(base64.b64decode(v['b']), '<f2').astype(np.float32).reshape(v['sh']) for k, v in j['cn'].items()}
def rep(nm, net, m):
    r, s, pr, ps = predict(net, X[m], True); ok = (r == R[m]) & (s == S[m]); c = (pr >= 0.95) & (ps >= 0.95)
    print('%s: %d/%d düz (%.1f%%) · ≥95%%: %d, səhv %d · cut: %d/%d' % (nm, ok.sum(), m.sum(), 100 * ok.mean(), c.sum(), (c & ~ok).sum(), (ok & (CUT[m] == 1)).sum(), (CUT[m] == 1).sum()))
rep('v1 → bütün zip-2 (heç görməyib)', v1, z2)
net = train(X[~hold], R[~hold], S[~hold], epochs=30, seed=2, wsamp=np.where(SRC[~hold] == 'user', 5.0, 1.0))
rep('v1 → zip-2 ayrılmış hissə', v1, hold); rep('v2 → zip-2 ayrılmış hissə', net, hold)
