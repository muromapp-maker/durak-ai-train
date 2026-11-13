import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; fps=int(sys.argv[2]) if len(sys.argv)>2 else 30
p=subprocess.Popen(['ffmpeg','-v','error','-i',f,'-vf','fps=%d'%fps,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
TOPX=[108,322,540,755,970]
def strip(a,cx,y0p,y1p):
    x0,x1=int((cx-95)*sc),int((cx+95)*sc); y0,y1=int(y0p*sc),int(y1p*sc)+1
    b=a[y0:y1,x0:x1].astype(int); R,G,B=b[...,0],b[...,1],b[...,2]
    return int(((R>190)&(G<90)&(B<120)).sum()), int(((R>140)&(R-G>80)&(R-B>60)).sum()), int(((G>150)&(G-R>40)&(B<110)).sum())
prev=None; i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    a=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    reg=a[int(280*sc):int(1500*sc)]
    wm=(reg>215).all(-1)
    s=''
    if prev is not None:
        nw=wm&~prev; n=int(nw.sum())
        if n>150:
            ys,xs=np.nonzero(nw); s='new %5d at (%4d,%4d) bb x%4d-%4d y%4d-%4d'%(n,xs.mean()/sc,ys.mean()/sc+280,xs.min()/sc,xs.max()/sc,ys.min()/sc+280,ys.max()/sc+280)
    prev=wm
    rs=' '.join('%d:%3d/%3d%s'%(k,*strip(a,x,235,245)[:2],'G' if strip(a,x,235,245)[2]>=6 else '') for k,x in enumerate(TOPX))
    me=strip(a,540,2156,2166)
    print('%5.2f %s | me r%3d g%3d | %s'%(i/fps,rs,me[0],me[2],s)); i+=1
