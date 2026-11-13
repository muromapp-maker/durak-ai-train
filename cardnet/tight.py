import sys, json, struct, numpy as np; sys.path.insert(0,'/tmp/smp1')
from PIL import Image
from cnn import Net, predict
from prep import norm, lab   # prep.py top-level runs; avoid
