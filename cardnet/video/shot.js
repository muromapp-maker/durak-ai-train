const fs=require('fs'),cp=require('child_process');
eval(fs.readFileSync('/home/claude/durak-ai/web/rec.js','utf8')+';global.DREC=DREC;');
for (const f of process.argv.slice(2)){
 const W=540; const info=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','csv=p=0',f]).toString().trim().split(',').map(Number);
 const H=Math.round(info[1]*W/info[0]);
 const raw=cp.execFileSync('ffmpeg',['-v','error','-i',f,'-vf','scale=540:'+H,'-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:1<<28});
 const img={width:W,height:H,data:raw}; console.log(f.split('/').pop(), JSON.stringify(DREC.rings(img,W/1080)));
}
