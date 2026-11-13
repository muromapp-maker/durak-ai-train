import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; t=float(sys.argv[2]); cx=int(sys.argv[3]); yt=int(sys.argv[4])
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',f,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout,np.uint8).reshape(H,W,3).astype(int)
x0,x1=int((cx-110)*sc),int((cx+110)*sc); y0,y1=int((yt-15)*sc),int((yt+200)*sc)
b=a[y0:y1,x0:x1]; R,G,B=b[...,0],b[...,1],b[...,2]
red=(R>190)&(G<90)&(B<120); grn=(G>150)&(G-R>40)&(B<110)
for nm,m in (('red',red),('grn',grn)):
    ys,xs=np.nonzero(m)
    if len(ys)==0: print(nm,0); continue
    print(nm,len(ys),'x',xs.min()/sc+cx-110,xs.max()/sc+cx-110,'y',ys.min()/sc+yt-15,ys.max()/sc+yt-15)
    rows=m.sum(1); print(' rows', ' '.join(str(v) for v in rows))
