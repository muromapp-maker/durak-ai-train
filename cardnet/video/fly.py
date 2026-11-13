import subprocess, numpy as np, sys
W,H=572,1280; sc=572/1080
f=sys.argv[1]; step=int(sys.argv[2]) if len(sys.argv)>2 else 4; seats=[int(x) for x in sys.argv[3].split(',')]
p=subprocess.Popen(['ffmpeg','-v','error','-i',f,'-vf','fps=30','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
CS=30; Y0,Y1=300,1700; NC=1080//CS; NR=(Y1-Y0)//CS
def grid(a):
    g=np.zeros((NR,NC),bool)
    for r in range(NR):
        for c in range(NC):
            n=0
            for dy in (5,15,25):
                for dx in (5,15,25):
                    px=a[int((Y0+r*CS+dy)*sc), int((c*CS+dx)*sc)]
                    if px[0]>222 and px[1]>222 and px[2]>222: n+=1
            g[r,c]=n>=6
    return g
G=[]; T=[]; i=0
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    if i%step==0:
        a=np.frombuffer(buf,np.uint8).reshape(H,W,3); G.append(grid(a)); T.append(i/30)
    i+=1
last=0
for k in range(1,len(G)-2):
    new=G[k]&~G[k-1]&G[k+1]&G[k+2]
    if new.sum()<25: continue
    rs,cs=np.nonzero(new); Py=Y0+rs.mean()*CS+15; Px=cs.mean()*CS+15
    rr=[r for r in np.nonzero(G[k])[0] if Y0+r*CS>=560]; tt=(Y0+min(rr)*CS) if rr else 1500
    votes={}; nT=0
    for j in range(max(last,k-10),k):
        tr=G[j]&~G[k]
        for r,c in zip(*np.nonzero(tr)):
            cy=Y0+r*CS+15; cx=c*CS+15
            if cy<430 or cy>tt-20: continue
            x0=Px+(cx-Px)*(330-Py)/(cy-Py)
            s=min(seats,key=lambda s:abs(s-x0)); votes[s]=votes.get(s,0)+1; nT+=1
    print('%5.2f tt%4d new %3d P(%4d,%4d) frames %d votes %s'%(T[k],tt,new.sum(),Px,Py,k-max(last,k-10),votes))
    last=k
