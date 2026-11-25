# -*- coding: utf-8 -*-
"""Sky chart: moon over Changsha 2026-11-21 evening. Pure Pillow."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1000, 1130
BG = (11, 16, 38)
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def font(sz, bold=False):
    p = "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc"
    try:
        return ImageFont.truetype(p, sz, index=0)
    except Exception:
        return ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", sz)

F_TITLE = font(40, True); F_SUB = font(24); F_LBL = font(22)
F_SMALL = font(20); F_BIG = font(30, True)

CX, CY, R = 470, 590, 380
GOLD = (245, 232, 180); DIM = (120, 130, 165); LINE = (70, 80, 120)
TXT = (225, 230, 245)

d.text((W//2, 42), "2026年11月21日 19:00 · 长沙", font=F_TITLE, fill=TXT, anchor="mm")
d.text((W//2, 92), "月亮方位 / 高度 / 月相（方位角自正北顺时针）", font=F_SUB, fill=DIM, anchor="mm")

# altitude circles
for alt in (0, 30, 60):
    r = R * (90 - alt) / 90
    d.ellipse([CX-r, CY-r, CX+r, CY+r], outline=LINE if alt else (140, 150, 190), width=2 if alt == 0 else 1)
    if alt:
        d.text((CX + r*0.707 + 6, CY - r*0.707 - 6), f"{alt}°", font=F_SMALL, fill=DIM, anchor="lm")
d.text((CX, CY), "天顶", font=F_SMALL, fill=DIM, anchor="mm")
d.text((CX + R*0.707 + 8, CY + R*0.707 + 8), "地平线", font=F_SMALL, fill=DIM, anchor="lm")

# cardinal directions (compass convention: N up, E right)
for name, az in (("北 N", 0), ("东 E", 90), ("南 S", 180), ("西 W", 270)):
    a = math.radians(az)
    x, y = CX + (R+34)*math.sin(a), CY - (R+34)*math.cos(a)
    d.text((x, y), name, font=F_LBL, fill=TXT, anchor="mm")
for az in range(0, 360, 30):
    a = math.radians(az)
    x1, y1 = CX + R*math.sin(a), CY - R*math.cos(a)
    x2, y2 = CX + (R-10)*math.sin(a), CY - (R-10)*math.cos(a)
    d.line([x1, y1, x2, y2], fill=LINE, width=2)

def pt(az, alt):
    r = R * (90 - alt) / 90
    a = math.radians(az)
    return CX + r*math.sin(a), CY - r*math.cos(a)

# evening trajectory
track = [(106.1, 46.3, "18:30"), (111.7, 52.4, "19:00"), (119.0, 58.3, "19:30"),
         (128.6, 63.7, "20:00"), (180.0, 72.5, "21:27 中天")]
pts = [pt(az, al) for az, al, _ in track]
for i in range(len(pts)-1):
    x1, y1 = pts[i]; x2, y2 = pts[i+1]
    n = 14
    for k in range(0, n, 2):
        t1, t2 = k/n, (k+1)/n
        d.line([x1+(x2-x1)*t1, y1+(y2-y1)*t1, x1+(x2-x1)*t2, y1+(y2-y1)*t2], fill=(150, 155, 190), width=2)
for (az, al, lbl), (x, y) in zip(track, pts):
    main = lbl == "19:00"
    rr = 13 if main else 6
    if main:
        for g, alpha in ((34, 26), (26, 40), (19, 60)):
            col = tuple(BG[c] + (GOLD[c]-BG[c])*alpha//100 for c in range(3))
            d.ellipse([x-g, y-g, x+g, y+g], fill=col)
    d.ellipse([x-rr, y-rr, x+rr, y+rr], fill=GOLD if main else (190, 195, 220))
    if main:
        d.text((x+24, y-26), "19:00", font=F_BIG, fill=GOLD, anchor="lm")
    elif lbl == "18:30":
        d.text((x+14, y+20), lbl, font=F_SMALL, fill=DIM, anchor="lm")
    elif lbl == "20:00":
        d.text((x+14, y+20), lbl, font=F_SMALL, fill=DIM, anchor="lm")
    elif lbl.startswith("21:27"):
        d.text((x, y+26), lbl, font=F_SMALL, fill=DIM, anchor="mm")

# moon phase icon (waxing gibbous, 87%, right side lit)
PX, PY, PR = 865, 210, 78
k = 0.87
d.ellipse([PX-PR-4, PY-PR-4, PX+PR+4, PY+PR+4], outline=LINE, width=2)
d.ellipse([PX-PR, PY-PR, PX+PR, PY+PR], fill=GOLD)
d.pieslice([PX-PR, PY-PR, PX+PR, PY+PR], 90, 270, fill=(38, 43, 66))
rx = PR * (2*k - 1)
d.pieslice([PX-rx, PY-PR, PX+rx, PY+PR], 90, 270, fill=GOLD)
for cx, cy, cr in ((0.35, -0.25, 0.13), (0.55, 0.2, 0.09), (0.15, 0.45, 0.10), (0.62, -0.5, 0.06)):
    x, y, r = PX+cx*PR, PY+cy*PR, cr*PR
    d.ellipse([x-r, y-r, x+r, y+r], fill=(222, 208, 158))
d.text((PX, PY+PR+30), "盈凸月", font=F_BIG, fill=TXT, anchor="mm")
d.text((PX, PY+PR+64), "照亮 87%", font=F_LBL, fill=GOLD, anchor="mm")
d.text((PX, PY+PR+94), "右亮左暗 · 近满月", font=F_SMALL, fill=DIM, anchor="mm")

# info panel
d.text((W//2, 1040), "方位角 ≈ 112°（东南偏东）　　高度角 ≈ 52°（半空偏上）",
       font=F_LBL, fill=TXT, anchor="mm")
d.text((W//2, 1074), "盈凸月 · 照亮约 87% · 月龄约 12 天 · 距离约 37.5 万公里",
       font=F_SMALL, fill=DIM, anchor="mm")
d.text((W//2, 1106), "满月：11月24日 22:53（超级月亮）· 月出 14:54 / 中天 21:27 / 月落 次日 04:06",
       font=F_SMALL, fill=DIM, anchor="mm")

out = r"E:\悦\website\moon-2026-11-21\moon_sky.png"
img.save(out)
print("saved", out)
