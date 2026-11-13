import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np
from cnn import Net, train, predict
d = np.load('/tmp/smp1/ds/data.npz'); X, R, S, G, SRC, CUT, RM = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['CUT'], d['RM']
rng = np.random.default_rng(7); z3 = G == 'zip3'; hold = z3 & (rng.random(len(X)) < 0.4)
def ld(f):
    n = Net(); j = json.load(open(f)); n.P = {k: np.frombuffer(base64.b64decode(v['b']), '<f2').astype(np.float32).reshape(v['sh']) for k, v in j['cn'].items()}; return n
def masked(Xm, RMm):
    Y = Xm.copy(); Y[:, :, :4] = 128
    for i in range(len(Y)): Y[i, :, RMm[i]:] = 128
    return Y
def rep(nm, net, m, mask=False):
    Xm = masked(X[m], RM[m]) if mask else X[m]
    r, s, pr, ps = predict(net, Xm, True); ok = (r == R[m]) & (s == S[m]); c = (pr >= 0.95) & (ps >= 0.95); c9 = (pr >= 0.9) & (ps >= 0.9)
    print('%s%s: %d/%d düz (%.1f%%) · ≥95%%: %d, səhv %d · ≥90%%: səhv %d' % (nm, ' [qonşu maskalı]' if mask else '', ok.sum(), m.sum(), 100 * ok.mean(), c.sum(), (c & ~ok).sum(), (c9 & ~ok).sum()), flush=True)
v2 = ld('/home/claude/durak-ai/ai/models/cardnet_v2.json')
rep('v2 → bütün zip-3 (görməyib)', v2, z3); rep('v2 → bütün zip-3', v2, z3, True)
net = train(X[~hold], R[~hold], S[~hold], epochs=30, seed=3, wsamp=np.where(SRC[~hold] == 'user', 5.0, 1.0), RM=RM[~hold])
rep('v2 → zip-3 ayrılmış', v2, hold); rep('v3 → zip-3 ayrılmış', net, hold)
rep('v2 → zip-3 ayrılmış', v2, hold, True); rep('v3 → zip-3 ayrılmış', net, hold, True)
