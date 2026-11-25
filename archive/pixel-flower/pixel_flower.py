# 像素风「包装红玫瑰」素材：只去掉【手】和【灰色背景】，保留花头+花下面的包装纸。
# 高分辨率像素化(清晰不糊) + 专用调色板 + 硬边透明轮廓 + 最近邻放大。
import numpy as np
from PIL import Image
from collections import deque
import base64, os

SRC = r"E:\悦\website\微信图片_20261116110020_240_102.jpg"
OUT = r"E:\悦\website"
a = np.asarray(Image.open(SRC).convert("RGB")).astype(np.int16)
H,W,_=a.shape
af=a.astype(float); R,G,B=af[...,0],af[...,1],af[...,2]
mx=af.max(2); mn=af.min(2); d=mx-mn
chroma=mx-mn
V=mx/255.0; S=np.where(mx>0,d/np.maximum(mx,1),0)
hue=np.zeros((H,W)); m=d>0
i=m&(mx==R); hue[i]=(60*((G-B)/np.maximum(d,1))%360)[i]
i=m&(mx==G); hue[i]=(60*((B-R)/np.maximum(d,1))+120)[i]
i=m&(mx==B); hue[i]=(60*((R-G)/np.maximum(d,1))+240)[i]
hue%=360
yy,xx=np.mgrid[0:H,0:W]

def dilate(m,it=1):
    r=m.copy()
    for _ in range(it):
        p=np.pad(r,1,constant_values=False)
        r=(p[:-2,1:-1]|p[2:,1:-1]|p[1:-1,:-2]|p[1:-1,2:]|p[1:-1,1:-1]|p[:-2,:-2]|p[:-2,2:]|p[2:,:-2]|p[2:,2:])
    return r
def erode(m,it=1):
    r=m.copy()
    for _ in range(it):
        p=np.pad(r,1,constant_values=True)
        r=(p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:]&p[1:-1,1:-1]&p[:-2,:-2]&p[:-2,2:]&p[2:,:-2]&p[2:,2:])
    return r
def largest(m):
    lab=np.zeros((H,W),np.int32);cur=0;best=0;bid=0
    for sy in range(H):
        for sx in range(W):
            if m[sy,sx] and lab[sy,sx]==0:
                cur+=1;q=deque([(sy,sx)]);lab[sy,sx]=cur;c=0
                while q:
                    y,x=q.popleft();c+=1
                    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=y+dy,x+dx
                        if 0<=ny<H and 0<=nx<W and m[ny,nx] and lab[ny,nx]==0:
                            lab[ny,nx]=cur;q.append((ny,nx))
                if c>best:best=c;bid=cur
    return lab==bid,best
def fill_holes(m):
    inv=~m;reach=np.zeros_like(inv);q=deque()
    for x in range(W):
        for y in(0,H-1):
            if inv[y,x] and not reach[y,x]:reach[y,x]=True;q.append((y,x))
    for y in range(H):
        for x in(0,W-1):
            if inv[y,x] and not reach[y,x]:reach[y,x]=True;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<H and 0<=nx<W and inv[ny,nx] and not reach[ny,nx]:
                reach[ny,nx]=True;q.append((ny,nx))
    return m|(inv&~reach)

# 1) 主体 = 非灰背景(灰背景 chroma≈2)；填洞补上白包装纸内部
subject=fill_holes(chroma>8)
# 2) 手 = 肤色(宽范围:色相6-52,饱和0.10-0.64,亮度0.32-1.0，含浅手腕/高光/阴影)。
#    包装纸是白纸(S<0.10)或深色(V<0.32)、花头是高饱和红(S>0.64)，都不落入肤色范围。
skin=(hue>=6)&(hue<=52)&(S>=0.20)&(S<=0.64)&(V>=0.32)
keep=subject&~skin
keep&=(xx<535)&(yy<632)   # 纸筒右缘~x520、底~y620；切掉右侧手与下方手腕(奶油包装纸S0.13-0.16由S>=0.20保护)
# 3) 清理：最大连通域(整支包装花) -> 填洞(补回包装纸内部误删的肤色像素) -> 闭运算平滑
keep,area=largest(keep)
keep=fill_holes(keep)
keep=erode(dilate(keep,1),1)
keep=fill_holes(keep)

ys,xs=np.where(keep); bb=(int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max()))
print("subject area",area,f"({area/(H*W)*100:.1f}%) bbox",bb,"w",bb[2]-bb[0],"h",bb[3]-bb[1])
print("hand region kept px (x>560,y>520):",int(keep[520:,560:].sum()))
print("wrap region kept px (x300-450,y450-580):",int(keep[450:580,300:450].sum()))
print("bloom region kept px (x300-450,y240-360):",int(keep[240:360,300:450].sum()))
print("shape map:")
N=24
for i in range(N):
    print("".join("#" if keep[i*H//N:(i+1)*H//N,j*W//N:(j+1)*W//N].mean()>0.4 else ("+" if keep[i*H//N:(i+1)*H//N,j*W//N:(j+1)*W//N].mean()>0.05 else " ") for j in range(N)))

pad=12
x0=max(0,bb[0]-pad);y0=max(0,bb[1]-pad);x1=min(W,bb[2]+pad);y1=min(H,bb[3]+pad)
rgb=a[y0:y1,x0:x1].astype(np.uint8); mk=keep[y0:y1,x0:x1]; bh,bw=mk.shape
Image.fromarray(np.dstack([rgb,(mk*255).astype(np.uint8)]),"RGBA").save(os.path.join(OUT,"flower_source.png"))

def kmeans(X,k,iters=30,seed=1):
    rng=np.random.default_rng(seed); C=X[rng.choice(len(X),k,replace=False)].astype(float).copy()
    for _ in range(iters):
        dd=((X[:,None,:]-C[None,:,:])**2).sum(2); lab=dd.argmin(1)
        for j in range(k):
            p=X[lab==j]
            if len(p):C[j]=p.mean(0)
    return C
def pixelate(rgb,mk,grid,colors):
    bh,bw=mk.shape
    if bw>=bh: gw=grid; gh=max(1,round(grid*bh/bw))
    else: gh=grid; gw=max(1,round(grid*bw/bh))
    small=np.asarray(Image.fromarray(rgb).resize((gw,gh),Image.BOX)).astype(float)
    ma=np.asarray(Image.fromarray((mk*255).astype(np.uint8)).resize((gw,gh),Image.BOX)).astype(float)
    flower=ma>128; cells=small[flower]; pal=kmeans(cells,min(colors,len(cells)))
    dd=((cells[:,None,:]-pal[None,:,:])**2).sum(2); assign=dd.argmin(1)
    gr=np.zeros((gh,gw,3),np.uint8); ga=np.zeros((gh,gw),np.uint8)
    fy,fx=np.where(flower); gr[fy,fx]=pal[assign].astype(np.uint8); ga[fy,fx]=255
    block=6
    big=Image.fromarray(np.dstack([gr,ga]),"RGBA").resize((gw*block,gh*block),Image.NEAREST)
    return big,pal,(gw,gh)

big,pal,(gw,gh)=pixelate(rgb,mk,110,22)
big.save(os.path.join(OUT,"pixel_flower.png"))
print("pixel grid",gw,"x",gh,"display",big.size)
print("palette:",[('#%02x%02x%02x'%tuple(int(v) for v in c)) for c in pal])
def checker(size,cell=14):
    w,h=size;yy,xx=np.mgrid[0:h,0:w];c=((xx//cell+yy//cell)%2).astype(np.uint8)
    g=np.where(c==0,238,208).astype(np.uint8);return Image.fromarray(np.stack([g]*3,-1),"RGB")
cb=checker(big.size);cb.paste(big,(0,0),big);cb.save(os.path.join(OUT,"pixel_flower_checker.png"))
wh=Image.new("RGB",big.size,(255,255,255));wh.paste(big,(0,0),big);wh.save(os.path.join(OUT,"pixel_flower_white.png"))
b64=base64.b64encode(open(os.path.join(OUT,"flower_source.png"),"rb").read()).decode()
open(os.path.join(OUT,"_bloom_b64.txt"),"w").write(b64)
print("source crop",(bw,bh),"b64 len",len(b64))
