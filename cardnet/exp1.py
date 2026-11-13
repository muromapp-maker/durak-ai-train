import sys; sys.path.insert(0, '/tmp/smp1'); import numpy as np, time
from cnn import train, predict
d = np.load('ds/data.npz'); X, R, S, G, SRC, CUT = d['X'], d['R'], d['S'], d['G'], d['SRC'], d['CUT']
rng = np.random.default_rng(42)
imgs = sorted(set(g for g in G if g.startswith('scr:'))); hold = set(imgs[1::2])
te_scr = np.array([g in hold for g in G]); is_zip = G == 'zip'; user = SRC == 'user'
va_zip = is_zip & ~user & (rng.random(len(X)) < 0.2)
tr = ~te_scr & ~va_zip & ~user
print('train', tr.sum(), 'val zip', va_zip.sum(), 'test ekran', te_scr.sum(), 'user', user.sum(), flush=True)
t0 = time.time()
net = train(X[tr], R[tr], S[tr], epochs=int(sys.argv[1]) if len(sys.argv) > 1 else 30, seed=1, log=lambda m: print(m, flush=True), Xv=X[va_zip], Rv=R[va_zip], Sv=S[va_zip])
print('vaxt %.0fs' % (time.time() - t0))
RS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']; SU = 'shdc'
def rep(name, m):
    r, s, pr, ps = predict(net, X[m], True); ok = (r == R[m]) & (s == S[m])
    print('%s: %d/%d düz (%.1f%%)' % (name, ok.sum(), m.sum(), 100 * ok.mean()))
    for i in np.where(~ok)[0][:12]: print('   doğru %s%s → model %s%s (əminlik %.2f/%.2f)' % (RS[R[m][i]], SU[S[m][i]], RS[r[i]], SU[s[i]], pr[i], ps[i]))
rep('zip val (görmədiyi)', va_zip); rep('ekran görüntüləri (görmədiyi yarı)', te_scr); rep('sənin 5 cavabın (görmədiyi)', user)
net.save('/tmp/smp1/net_exp1.json', {'exp': 1})
from PIL import Image
r, s = predict(net, X[va_zip]); bad = np.where(~((r == R[va_zip]) & (s == S[va_zip])))[0]
ims = [Image.fromarray(X[va_zip][i]).resize((72, 96)) for i in bad]
sh = Image.new('RGB', (80 * len(ims), 96), 'white'); [sh.paste(im, (80 * k, 0)) for k, im in enumerate(ims)]; sh.save('/tmp/smp1/bad.png')
