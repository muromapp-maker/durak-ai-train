import sys; sys.path.insert(0, '/tmp/smp1'); import numpy as np
from cnn import train, predict
d = np.load('ds/data.npz'); X, R, S, SRC = d['X'], d['R'], d['S'], d['SRC']
w = np.where(SRC == 'user', 5.0, 1.0)
net = train(X, R, S, epochs=30, seed=1, wsamp=w)
r, s = predict(net, X); print('hamısında düz: %.1f%%' % (100 * ((r == R) & (s == S)).mean()))
net.save('/home/claude/durak-ai/ai/models/cardnet_v1.json', {'n': int(len(X)), 'in': [48, 36], 'ranks': '2 3 4 5 6 7 8 9 10 J Q K A', 'suits': 'shdc'})
