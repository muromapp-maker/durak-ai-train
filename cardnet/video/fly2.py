import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; seats=[int(x) for x in sys.argv[2].split(',')]
p=subprocess.Popen(['ffmpeg','-v','error','-i',f,'-vf','fps=25','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
CS=30
def grid(a,Y0,Y1):
    NR=(Y1-Y0)//CS; g=np.zeros((NR,36),bool)
    ys=np.array([[(Y0+r*CS+dy) for dy in (5,15,25)] for r in range(NR)]); 
    for r in range(NR):
        for c in range(36):
            n=0
            for dy in (5,15,25):
                for dx in (5,15,25):
                    px=a[int((Y0+r*CS+dy)*sc), int((c*CS+dx)*sc)]
                    n+= px[0]>222 and px[1]>222 and px[2]>222
            g[r,c]=n>=6
    return g
B=[];F=[];i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    a=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    B.append(grid(a,420,1000))
    F.append(grid(a,300,1700) if i%3==0 else None)   # app kadrı ~120 ms
    i+=1
app=[k for k in range(len(F)) if F[k] is not None]
FLYT0=-9
for ii in range(1,len(app)-2):
    k=app[ii]; g0=F[app[ii-1]]; g1=F[k]
    new=g1&~g0&F[app[ii+1]]&F[app[ii+2]]
    if new.sum()<25: continue
    rs,cs=np.nonzero(new); Py=300+rs.mean()*CS+15; Px=cs.mean()*CS+15
    rr=[r for r in np.nonzero(g1)[0] if 300+r*CS>=560]; top=(300+min(rr)*CS) if rr else 1500
    Tk=k/25; fin=B[min(len(B)-1,k+2)]   # sorğu anında son zolaq kadrı
    v={}
    for j in range(len(B)):
        t=j/25
        if t<max(FLYT0-0.15,Tk-1.5) or t>Tk+0.06: continue
        tr=B[j]&~fin
        for r,c in zip(*np.nonzero(tr)):
            cy=420+r*CS+15; cx=c*CS+15
            if cy<430 or cy>top-20 or Py-cy<60: continue
            x0=Px+(cx-Px)*(330-Py)/(cy-Py); s=min(seats,key=lambda s:abs(s-x0)); v[s]=v.get(s,0)+1
    tot=sum(v.values()); best=max(v,key=v.get) if v else None
    res=best if tot>=3 and v[best]/tot>=0.7 else '?'
    print('%5.2f P(%4d,%4d) top%4d votes %s -> %s'%(Tk,Px,Py,top,v,res))
    FLYT0=Tk
