const fs=require('fs'),cp=require('child_process');
eval(fs.readFileSync('/home/claude/durak-ai/web/rec.js','utf8')+';global.DREC=DREC;');
const [f,seats]=[process.argv[2],process.argv[3]];
const W=540,H=Math.round(1280*540/572);  // app: 540 en
const raw=cp.execFileSync('ffmpeg',['-v','error','-i',f,'-vf','fps=5,scale=540:'+H,'-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:1<<30});
const N=W*H*4; let p='';
for(let k=0;k*N<raw.length;k++){const img={width:W,height:H,data:raw.subarray(k*N,(k+1)*N)};const r=DREC.rings(img,W/1080);
 const s=r.top.map(x=>x?x[0].toUpperCase():'.').join('')+' me'+(r.me||'.'); if(s!==p){console.log((k/5).toFixed(1),s);p=s;}}
