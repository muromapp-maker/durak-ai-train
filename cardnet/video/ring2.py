import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; fps=10
p=subprocess.Popen(['ffmpeg','-v','error','-i',f,'-vf','fps=%d'%fps,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
def runmax(m):
    best=0
    for ax in (0,1):
        mm=m if ax==0 else m.T
        # longest run along axis 0 for each column
        cur=np.zeros(mm.shape[1],int); bm=np.zeros(mm.shape[1],int)
        for r in mm:
            cur=np.where(r,cur+1,0); bm=np.maximum(bm,cur)
        best=max(best,bm.max())
    return best/sc
def st(a,cx,ya,yb):
    x0,x1=int((cx-105)*sc),int((cx+105)*sc); y0,y1=int(ya*sc),int(yb*sc)
    b=a[y0:y1,x0:x1].astype(int); R,G,B=b[...,0],b[...,1],b[...,2]
    rr=runmax((R>190)&(G<90)&(B<120)); gg=runmax((G>150)&(G-R>40)&(B<110))
    return 'G' if gg>=100 and gg>=rr else ('R' if rr>=100 else '.'), int(rr), int(gg)
i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    a=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    s=[st(a,x,200,470) for x in (108,322,540,755,970)]; m=st(a,540,2130,2370)
    print('%5.1f'%(i/fps),' '.join('%s%3d/%3d'%v for v in s),'| me %s%3d/%3d'%m); i+=1
