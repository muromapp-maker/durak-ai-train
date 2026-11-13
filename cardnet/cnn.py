# Kart küncü tanıyan kiçik CNN (numpy): giriş 48x36 RGB → rəqəm (13) + şəkil (4)
# conv3x3(3→16)·ReLU·pool2 → conv3x3(16→32)·ReLU·pool2 → conv3x3(32→48)·ReLU·pool2 → fc 1152→64·ReLU → rank 13 / suit 4
import numpy as np, json, sys, time

def im2col(x, k=3, p=1):  # x: N,C,H,W → N*H*W, C*k*k
    N, C, H, W = x.shape; xp = np.pad(x, ((0, 0), (0, 0), (p, p), (p, p)))
    s = np.lib.stride_tricks.sliding_window_view(xp, (k, k), axis=(2, 3))  # N,C,H,W,k,k
    return s.transpose(0, 2, 3, 1, 4, 5).reshape(N * H * W, C * k * k)
def col2im(dc, shape, k=3, p=1):
    N, C, H, W = shape; dx = np.zeros((N, C, H + 2 * p, W + 2 * p), dc.dtype)
    d = dc.reshape(N, H, W, C, k, k)
    for i in range(k):
        for j in range(k): dx[:, :, i:i + H, j:j + W] += d[:, :, :, :, i, j].transpose(0, 3, 1, 2)
    return dx[:, :, p:p + H, p:p + W]

class Net:
    def __init__(s, seed=0, nr=13):
        r = np.random.default_rng(seed); he = lambda n, *sh: (r.standard_normal(sh) * np.sqrt(2 / n)).astype(np.float32)
        s.P = {'c1': he(27, 27, 16), 'b1': np.zeros(16, np.float32), 'c2': he(144, 144, 32), 'b2': np.zeros(32, np.float32),
               'c3': he(288, 288, 48), 'b3': np.zeros(48, np.float32), 'f': he(1152, 1152, 64), 'bf': np.zeros(64, np.float32),
               'r': he(64, 64, nr), 'br': np.zeros(nr, np.float32), 's': he(64, 64, 4), 'bs': np.zeros(4, np.float32)}
    def conv(s, x, w, b, cache):
        N, C, H, W = x.shape; col = im2col(x); y = col @ w + b; y = y.reshape(N, H, W, -1).transpose(0, 3, 1, 2)
        cache.append((col, x.shape)); return y
    def fwd(s, x, train=False):
        P = s.P; c = s.c = []; h = x
        for k in ('1', '2', '3'):
            y = s.conv(h, P['c' + k], P['b' + k], c); m = y > 0; y = y * m
            N, C, H, W = y.shape; H2, W2 = H // 2, W // 2; yy = y[:, :, :H2 * 2, :W2 * 2].reshape(N, C, H2, 2, W2, 2)
            pm = yy.max(axis=(3, 5)); c.append((m, y.shape, yy, pm)); h = pm
        s.flat = h.reshape(len(h), -1); z = s.flat @ P['f'] + P['bf']; s.zm = z > 0; s.hz = z * s.zm
        return s.hz @ P['r'] + P['br'], s.hz @ P['s'] + P['bs']
    def bwd(s, gr, gs):
        P = s.P; G = {}
        G['r'] = s.hz.T @ gr; G['br'] = gr.sum(0); G['s'] = s.hz.T @ gs; G['bs'] = gs.sum(0)
        dz = (gr @ P['r'].T + gs @ P['s'].T) * s.zm; G['f'] = s.flat.T @ dz; G['bf'] = dz.sum(0)
        dh = (dz @ P['f'].T); c = s.c
        for k in ('3', '2', '1'):
            m, shp, yy, pm = c.pop(); col, xs = c.pop()
            dh = dh.reshape(pm.shape); mask = (yy == pm[:, :, :, None, :, None])
            dyy = mask * dh[:, :, :, None, :, None]; dy = np.zeros(shp, np.float32)
            N, C, H2, _, W2, _ = yy.shape; dy[:, :, :H2 * 2, :W2 * 2] = dyy.reshape(N, C, H2 * 2, W2 * 2); dy *= m
            d2 = dy.transpose(0, 2, 3, 1).reshape(-1, shp[1]); G['c' + k] = col.T @ d2; G['b' + k] = d2.sum(0)
            if k != '1': dh = col2im(d2 @ P['c' + k].T, xs)
        return G
    def save(s, f, meta): json.dump({'meta': meta, 'P': {k: v.round(5).tolist() for k, v in s.P.items()}}, open(f, 'w'))
    def load(s, f): s.P = {k: np.array(v, np.float32) for k, v in json.load(open(f))['P'].items()}

def softmax(z): z = z - z.max(1, keepdims=True); e = np.exp(z); return e / e.sum(1, keepdims=True)

SYN = None   # süni sıx əl: qonşu kartlar üçün donor şəkillər (train-də verilir)
def synth(a, i, rng, RM):
    # sağ qonşu: başqa kartın küncü bu kartın üstünə düşür (kənarında kölgə xətti); sol qonşu: soldakı kartın zolağı
    if SYN is None: return a
    if rng.random() < 0.35:
        d = SYN[rng.integers(len(SYN))].astype(np.float32); c = int(rng.integers(min(RM[i] if RM is not None else 22, 33), 35))
        a[:, c:] = d[:, :36 - c]; a[:, c] = a[:, c] * 0.55
    if rng.random() < 0.2:
        d = SYN[rng.integers(len(SYN))].astype(np.float32); w = int(rng.integers(2, 6)); k = int(rng.integers(6, 20))
        a[:, :w] = d[:, k:k + w]; a[:, w] = a[:, w] * 0.7
    if rng.random() < 0.25:   # kiçik fırlanma / miqyas (kart əyri düşür)
        from scipy.ndimage import affine_transform
        t = np.deg2rad(rng.uniform(-7, 7)); s = rng.uniform(0.88, 1.12); M = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]]) / s
        ctr = np.array([24, 18]); off = ctr - M @ ctr
        a = np.stack([affine_transform(a[:, :, ch], M, off, order=1, cval=128) for ch in range(3)], 2)
    if rng.random() < 0.15: a = (a + np.roll(a, 1, 0) + np.roll(a, 1, 1)) / 3   # bulanıq
    return a
def augment(X, rng, RM=None):  # X: N,H,W,3 uint8 → float N,3,H,W
    N = len(X); out = np.empty((N, 48, 36, 3), np.float32)
    for i in range(N):
        a = synth(X[i].astype(np.float32), i, rng, RM)
        dy, dx = rng.integers(-3, 4), rng.integers(-3, 4); a = np.roll(a, (dy, dx), (0, 1))
        if dy > 0: a[:dy] = 128
        elif dy < 0: a[dy:] = 128
        if dx > 0: a[:, :dx] = 128
        elif dx < 0: a[:, dx:] = 128
        if rng.random() < 0.3: a[:, rng.integers(14, 30):] = rng.uniform(60, 200)   # sağdan örtülür (sıx əl / üst-üstə kart)
        if RM is not None:   # tətbiqdəki qonşu maskası (boz 128): sol kart kənarı, sağ qonşunun kənarı
            if rng.random() < 0.4: a[:, :rng.integers(2, 6)] = 128
            if rng.random() < 0.4: a[:, rng.integers(RM[i], 37):] = 128
        a = (a - 128) * rng.uniform(0.7, 1.3) + 128 + rng.uniform(-30, 30)
        out[i] = a
    return prep(out)
def prep(X): X = np.asarray(X, np.float32); return ((X - 128) / 64).transpose(0, 3, 1, 2).copy()

def train(Xtr, Rtr, Str, epochs=40, seed=0, log=None, Xv=None, Rv=None, Sv=None, lr=2e-3, wsamp=None, RM=None, nr=13):
    net = Net(seed, nr); rng = np.random.default_rng(seed); P = net.P
    M = {k: np.zeros_like(v) for k, v in P.items()}; V = {k: np.zeros_like(v) for k, v in P.items()}; t = 0
    N = len(Xtr); p = None if wsamp is None else wsamp / wsamp.sum()
    for ep in range(epochs):
        idx = rng.choice(N, N, p=p) if p is not None else rng.permutation(N); L = 0; t0 = time.time()
        a = lr * (0.5 * (1 + np.cos(np.pi * ep / epochs)))
        for b in range(0, N, 64):
            j = idx[b:b + 64]; x = augment(Xtr[j], rng, None if RM is None else RM[j]); zr, zs = net.fwd(x, True)
            pr, ps = softmax(zr), softmax(zs); n = len(j)
            sm = (Rtr[j] < 13).astype(np.float32)[:, None]   # "kart deyil" (14-cü sinif) — rəng öyrədilmir
            L += -(np.log(pr[np.arange(n), Rtr[j]] + 1e-9).sum() + (np.log(ps[np.arange(n), Str[j]] + 1e-9) * sm[:, 0]).sum())
            pr[np.arange(n), Rtr[j]] -= 1; ps[np.arange(n), Str[j]] -= 1; ps *= sm
            G = net.bwd(pr / n, ps / n); t += 1
            for k in P:
                g = G[k] + 1e-4 * P[k]; M[k] = 0.9 * M[k] + 0.1 * g; V[k] = 0.999 * V[k] + 0.001 * g * g
                P[k] -= a * (M[k] / (1 - 0.9 ** t)) / (np.sqrt(V[k] / (1 - 0.999 ** t)) + 1e-8)
        if log and (ep % 5 == 4 or ep == epochs - 1):
            msg = 'ep %d loss %.3f (%.0fs)' % (ep + 1, L / N, time.time() - t0)
            if Xv is not None and len(Xv): r, s = predict(net, Xv); msg += ' val rank %.3f suit %.3f card %.3f' % ((r == Rv).mean(), (s == Sv).mean(), ((r == Rv) & (s == Sv)).mean())
            log(msg)
    return net

def predict(net, X, prob=False):
    R, S, PR, PS = [], [], [], []
    for b in range(0, len(X), 256):
        zr, zs = net.fwd(prep(X[b:b + 256])); pr, ps = softmax(zr), softmax(zs)
        R.append(pr.argmax(1)); S.append(ps.argmax(1)); PR.append(pr.max(1)); PS.append(ps.max(1))
    R, S = np.concatenate(R), np.concatenate(S)
    return (R, S, np.concatenate(PR), np.concatenate(PS)) if prob else (R, S)
