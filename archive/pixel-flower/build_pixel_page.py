import os
OUT=r"E:\悦\website"
b64=open(os.path.join(OUT,"_bloom_b64.txt")).read().strip()
html=r"""<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>像素玫瑰 · Pixel Rose</title>
<style>
  :root{--pink:#ff8fab;--pink-d:#fb6f92;--cream:#fff0f3;--ink:#5a3a44;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{min-height:100vh;font-family:"Segoe UI","Microsoft YaHei",sans-serif;color:var(--ink);
    background:linear-gradient(135deg,#ffe5ec 0%,#fff0f3 45%,#ffc2d1 100%);
    display:flex;flex-direction:column;align-items:center;padding:28px 16px 60px;}
  h1{font-size:clamp(22px,4vw,34px);letter-spacing:2px;margin-bottom:4px;
    text-shadow:2px 2px 0 #fff;}
  .sub{font-size:13px;opacity:.7;margin-bottom:22px;letter-spacing:1px;}
  .frame{background:#fff;border:4px solid var(--ink);border-radius:6px;
    box-shadow:8px 8px 0 rgba(90,58,68,.25);padding:14px;max-width:94vw;}
  .stage{position:relative;width:min(88vw,560px);height:min(88vw,560px);
    display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:3px;}
  .stage.checker{background-image:linear-gradient(45deg,#e9e9e9 25%,transparent 25%),
    linear-gradient(-45deg,#e9e9e9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e9e9e9 75%),
    linear-gradient(-45deg,transparent 75%,#e9e9e9 75%);
    background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0;background-color:#fbfbfb;}
  .stage.white{background:#fff;}
  .stage.dark{background:#2b2b33;}
  canvas{image-rendering:pixelated;image-rendering:crisp-edges;max-width:100%;max-height:100%;}
  #src{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;opacity:0;pointer-events:none;transition:opacity .2s;image-rendering:auto;}
  #src.show{opacity:.55;}
  .panel{margin-top:22px;width:min(92vw,560px);background:#fff;border:4px solid var(--ink);
    border-radius:6px;box-shadow:8px 8px 0 rgba(90,58,68,.25);padding:18px 20px;}
  .row{display:flex;align-items:center;gap:12px;margin:12px 0;}
  .row label{width:96px;font-size:14px;font-weight:600;flex-shrink:0;}
  .row input[type=range]{flex:1;accent-color:var(--pink-d);height:6px;}
  .val{width:40px;text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:var(--pink-d);}
  .opts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:6px;}
  select,button{font-family:inherit;font-size:14px;border:3px solid var(--ink);border-radius:4px;
    padding:7px 12px;background:var(--cream);color:var(--ink);cursor:pointer;font-weight:600;}
  button:hover,select:hover{background:#ffe0e8;}
  button.primary{background:var(--pink-d);color:#fff;}
  button.primary:hover{background:var(--pink);}
  .chk{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer;}
  .pal{display:flex;flex-wrap:wrap;gap:5px;margin-top:14px;}
  .sw{width:26px;height:26px;border:2px solid var(--ink);border-radius:3px;}
  .hint{font-size:12px;opacity:.65;margin-top:14px;line-height:1.6;}
</style>
</head>
<body>
  <h1>像素玫瑰 · Pixel Rose</h1>
  <div class="sub">整支包装玫瑰 · 只去手和背景 · 保留花头与包装纸 · 可调像素风素材</div>
  <div class="frame">
    <div class="stage checker" id="stage">
      <canvas id="disp"></canvas>
      <img id="src" alt="source">
    </div>
  </div>
  <div class="panel">
    <div class="row"><label>像素粒度</label><input id="grid" type="range" min="40" max="180" value="110"><span class="val" id="gridv">110</span></div>
    <div class="row"><label>色彩层数</label><input id="colors" type="range" min="6" max="32" value="22"><span class="val" id="colorsv">22</span></div>
    <div class="opts">
      <select id="bg"><option value="checker">棋盘格底</option><option value="white">白底</option><option value="dark">深色底</option></select>
      <label class="chk"><input type="checkbox" id="showsrc"> 叠加原图</label>
      <button class="primary" id="dl">下载 PNG</button>
      <button id="reset">重置</button>
    </div>
    <div class="pal" id="pal"></div>
    <div class="hint">粒度越小越「马赛克」、越大越细腻；色彩层数越少越复古。调好后点「下载 PNG」得到透明背景素材，可直接放进网站或别处用。全部在本地浏览器完成，不上传。</div>
  </div>
<script>
const SRC="data:image/png;base64,__B64__";
const disp=document.getElementById('disp'),dctx=disp.getContext('2d');
const small=document.createElement('canvas'),sctx=small.getContext('2d');
const srcImg=document.getElementById('src'),stage=document.getElementById('stage');
const gridS=document.getElementById('grid'),colS=document.getElementById('colors');
const gridv=document.getElementById('gridv'),colorsv=document.getElementById('colorsv');
const palBox=document.getElementById('pal');
let srcData=null,sw=0,sh=0;
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const img=new Image();
img.onload=function(){sw=img.naturalWidth;sh=img.naturalHeight;const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d');x.drawImage(img,0,0);srcData=x.getImageData(0,0,sw,sh);srcImg.src=SRC;render();};
img.src=SRC;
function downsample(grid){let gw,gh;if(sw>=sh){gw=grid;gh=Math.max(1,Math.round(grid*sh/sw));}else{gh=grid;gw=Math.max(1,Math.round(grid*sw/sh));}
  const data=srcData.data,bw=sw/gw,bh=sh/gh,out=[];
  for(let gy=0;gy<gh;gy++){for(let gx=0;gx<gw;gx++){const x0=Math.floor(gx*bw),x1=Math.max(x0+1,Math.floor((gx+1)*bw)),y0=Math.floor(gy*bh),y1=Math.max(y0+1,Math.floor((gy+1)*bh));
    let r=0,g=0,b=0,a=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*sw+x)*4;r+=data[i];g+=data[i+1];b+=data[i+2];a+=data[i+3];n++;}
    out.push([r/n,g/n,b/n,a/n]);}}
  return{gw,gh,out};}
function kmeans(pts,k,seed){const rand=rng(seed);const C=[];const used=new Set();let guard=0;
  while(C.length<k&&guard++<k*50){const i=Math.floor(rand()*pts.length);if(!used.has(i)){used.add(i);C.push(pts[i].slice());}}
  while(C.length<k)C.push(pts[Math.floor(rand()*pts.length)].slice());
  for(let it=0;it<24;it++){const groups=Array.from({length:k},()=>[]);
    for(const p of pts){let bi=0,bd=1e18;for(let j=0;j<k;j++){const dr=p[0]-C[j][0],dg=p[1]-C[j][1],db=p[2]-C[j][2],dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;bi=j;}}groups[bi].push(p);}
    for(let j=0;j<k;j++){if(groups[j].length){let r=0,g=0,b=0;for(const p of groups[j]){r+=p[0];g+=p[1];b+=p[2];}const n=groups[j].length;C[j]=[r/n,g/n,b/n];}}}
  return C;}
function render(){if(!srcData)return;const grid=+gridS.value,colors=+colS.value;gridv.textContent=grid;colorsv.textContent=colors;
  const{gw,gh,out}=downsample(grid);const pts=[],idx=[];out.forEach((c,i)=>{if(c[3]>128){pts.push([c[0],c[1],c[2]]);idx.push(i);}});
  const k=Math.min(colors,Math.max(1,pts.length));const pal=kmeans(pts,k,12345);
  const gimg=new ImageData(gw,gh);
  for(let i=0;i<out.length;i++){const c=out[i],o=i*4;if(c[3]>128){let bi=0,bd=1e18;for(let j=0;j<pal.length;j++){const dr=c[0]-pal[j][0],dg=c[1]-pal[j][1],db=c[2]-pal[j][2],dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;bi=j;}}gimg.data[o]=pal[bi][0];gimg.data[o+1]=pal[bi][1];gimg.data[o+2]=pal[bi][2];gimg.data[o+3]=255;}else gimg.data[o+3]=0;}
  small.width=gw;small.height=gh;sctx.putImageData(gimg,0,0);
  const block=Math.max(4,Math.floor(560/Math.max(gw,gh)));disp.width=gw*block;disp.height=gh*block;
  dctx.imageSmoothingEnabled=false;dctx.clearRect(0,0,disp.width,disp.height);dctx.drawImage(small,0,0,disp.width,disp.height);
  palBox.innerHTML='';pal.forEach(c=>{const d=document.createElement('div');d.className='sw';const hex='#'+[c[0],c[1],c[2]].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');d.style.background=hex;d.title=hex;palBox.appendChild(d);});}
gridS.addEventListener('input',render);colS.addEventListener('input',render);
document.getElementById('bg').addEventListener('change',e=>{stage.className='stage '+e.target.value;});
document.getElementById('showsrc').addEventListener('change',e=>{srcImg.classList.toggle('show',e.target.checked);});
document.getElementById('reset').addEventListener('click',()=>{gridS.value=110;colS.value=22;document.getElementById('bg').value='checker';stage.className='stage checker';document.getElementById('showsrc').checked=false;srcImg.classList.remove('show');render();});
document.getElementById('dl').addEventListener('click',()=>{try{const a=document.createElement('a');a.download='pixel_flower.png';a.href=disp.toDataURL('image/png');a.click();}catch(err){alert('导出失败：'+err.message);}});
</script>
</body>
</html>"""
html=html.replace("__B64__",b64)
open(os.path.join(OUT,"pixel_flower.html"),"w",encoding="utf-8").write(html)
print("wrote pixel_flower.html",len(html),"chars")
