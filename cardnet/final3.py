import sys, json, base64; sys.path.insert(0, '/tmp/smp1'); import numpy as np
from cnn import train, predict
d = np.load('/tmp/smp1/ds/data.npz'); X, R, S, SRC, RM = d['X'], d['R'], d['S'], d['SRC'], d['RM']
net = train(X, R, S, epochs=30, seed=4, wsamp=np.where(SRC == 'user', 5.0, 1.0), RM=RM)
r, s = predict(net, X); print('hamısında düz: %.2f%%' % (100 * ((r == R) & (s == S)).mean()), flush=True)
cn = {k: {'sh': list(v.shape), 'b': base64.b64encode(v.astype('<f2').tobytes()).decode()} for k, v in net.P.items()}
json.dump({'meta': {'n': int(len(X)), 'in': [48, 36], 'ranks': '2 3 4 5 6 7 8 9 10 J Q K A', 'suits': 'shdc', 'v': 3, 'mask': 1}, 'cn': cn}, open('/home/claude/durak-ai/ai/models/cardnet_v3.json', 'w'))
print('ok')
