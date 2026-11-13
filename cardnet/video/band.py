import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; fps=30; Y0,Y1=470,770
p=subprocess.Popen(['ffmpeg','-v','error','-i',f,'-vf','fps=%d'%fps,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    a=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    b=a[int(Y0*sc):int(Y1*sc)].astype(int)
    wm=(b>222).all(-1); n=int(wm.sum())
    if n>400:
        ys,xs=np.nonzero(wm)
        print('%5.2f n%5d c(%4d,%4d) x%4d-%4d y%4d-%4d'%(i/fps,n,xs.mean()/sc,ys.mean()/sc+Y0,xs.min()/sc,xs.max()/sc,ys.min()/sc+Y0,ys.max()/sc+Y0))
    i+=1
