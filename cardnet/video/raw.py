import subprocess, numpy as np, sys
exec(open('fly.py').read().split('G=[]')[0].replace("f=sys.argv[1]; step=int(sys.argv[2]) if len(sys.argv)>2 else 4; seats=[int(x) for x in sys.argv[3].split(',')]","f=sys.argv[1]"))
G=[];i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    if i%2==0: G.append(grid(np.frombuffer(buf,np.uint8).reshape(H,W,3)))
    i+=1
for k in range(len(G)):
    a=G[max(0,k-15)]; b=G[min(len(G)-1,k+15)]
    tr=G[k]&~a&~b
    rs,cs=np.nonzero(tr); sel=[(r,c) for r,c in zip(rs,cs) if 420<=Y0+r*CS<=560]
    if len(sel)>=2:
        xs=[c*CS+15 for r,c in sel]; ys=[Y0+r*CS+15 for r,c in sel]
        print('%5.2f n%3d x%4d-%4d y%4d-%4d'%(k/15,len(sel),min(xs),max(xs),min(ys),max(ys)))
