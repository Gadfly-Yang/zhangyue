# -*- coding: utf-8 -*-
"""Moon position for Changsha 2026-11-21 ~19:00 CST. Meeus ch.47 (full 60-term tables)."""
import math
from datetime import datetime, timedelta, timezone

D2R = math.pi / 180.0
R2D = 180.0 / math.pi

def jd_from_utc(dt):
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute/60 + dt.second/3600) / 24.0
    if m <= 2:
        y -= 1; m += 12
    A = y // 100
    B = 2 - A + A // 4
    return math.floor(365.25*(y+4716)) + math.floor(30.6001*(m+1)) + d + B - 1524.5

# Meeus Table 47.A  (D, M, M', F, coef_l [1e-6 deg], coef_r [1e-3 km], coef_b [1e-6 deg])
TERMS = [
(0,0,1,0,6288774,-20905355,5128122),(2,0,-1,0,1274027,-3699111,280602),
(2,0,0,0,658314,-2955968,277693),(0,0,2,0,213618,-569925,173237),
(0,1,0,0,-185116,48888,55413),(0,0,0,2,-114332,-3149,46271),
(2,0,-2,0,58793,246158,32573),(2,-1,-1,0,57066,-152138,17198),
(2,0,1,0,53322,-170733,9266),(2,-1,0,0,45758,-204586,8822),
(0,1,-1,0,-40923,-129620,8216),(1,0,0,0,-34720,108743,4324),
(0,1,1,0,-30383,104755,4200),(2,0,0,-2,15327,10321,-3359),
(0,0,1,2,-12528,0,2463),(0,0,1,-2,10980,79661,2211),
(4,0,-1,0,10675,-34782,2065),(0,0,3,0,10034,-23210,-1870),
(4,0,-2,0,8548,-21636,1828),(2,1,-1,0,-7888,24208,-1794),
(2,1,0,0,-6766,30824,-1749),(1,0,-1,0,-5163,-8379,-1565),
(1,1,0,0,4987,-16675,-1491),(2,-1,1,0,4036,-12831,-1475),
(2,0,2,0,3994,-10445,-1410),(4,0,0,0,3861,-11650,-1344),
(2,0,-3,0,3665,14403,-1335),(0,1,-2,0,-2689,-7003,1107),
(2,0,-1,2,-2602,0,1021),(2,-1,-2,0,2390,10056,833),
(1,0,1,0,-2348,6322,777),(2,-2,0,0,2236,-9884,671),
(0,1,2,0,-2120,5751,607),(0,2,0,0,-2069,0,596),
(2,-2,-1,0,2048,-4950,491),(2,0,1,-2,-1773,4130,-451),
(2,0,0,2,-1595,0,439),(4,-1,-1,0,1215,-3958,422),
(0,0,2,2,-1110,0,421),(3,0,-1,0,-892,3258,-366),
(2,1,1,0,-810,2616,-351),(4,-1,-2,0,759,-1897,331),
(0,2,-1,0,-713,-2117,315),(2,2,-1,0,-700,2354,302),
(2,1,-2,0,691,0,-283),(2,-1,0,-2,596,0,-229),
(4,0,1,0,549,-1423,223),(0,0,4,0,537,-1117,223),
(4,-1,0,0,520,-1571,-220),(1,0,-2,0,-487,-1739,-220),
(2,1,0,-2,-399,0,-185),(0,0,2,-2,-381,-4421,181),
(1,1,1,0,351,0,-177),(3,0,-2,0,-340,0,176),
(4,0,-3,0,330,0,-166),(2,-1,2,0,327,0,-164),
(0,2,1,0,-323,1165,132),(1,1,-1,0,299,0,-119),
(2,0,3,0,294,0,115),(2,0,-1,-2,0,8752,107),
]

# Meeus Table 47.B latitude series — SEPARATE ordering from longitude series!
SB_TERMS = [
(0,0,0,1,5128122),(0,0,1,1,280602),(0,0,1,-1,277693),(2,0,0,-1,173237),
(2,0,-1,1,55413),(2,0,-1,-1,46271),(2,0,0,1,32573),(0,0,2,1,17198),
(2,0,1,-1,9266),(0,0,2,-1,8822),(2,-1,0,-1,8216),(2,0,-2,-1,4324),
(2,0,1,1,4200),(2,1,0,-1,-3359),(2,-1,-1,1,2463),(2,-1,0,1,2211),
(2,-1,-1,-1,2065),(0,1,-1,-1,-1870),(4,0,-1,-1,1828),(0,1,0,1,-1794),
(0,0,0,3,-1749),(0,1,-1,1,-1565),(1,0,0,1,-1491),(0,1,1,1,-1475),
(0,1,1,-1,-1410),(0,1,0,-1,-1344),(1,0,0,-1,-1335),(0,0,3,1,1107),
(4,0,0,-1,1021),(4,0,-1,1,833),(0,0,1,-3,777),(4,0,-2,1,671),
(2,0,0,-3,607),(2,0,2,-1,596),(2,-1,1,-1,491),(2,0,-2,1,-451),
(0,0,3,-1,439),(2,0,2,1,422),(2,0,-3,-1,421),(2,1,-1,1,-366),
(2,1,0,1,-351),(4,0,0,1,331),(2,-1,1,1,315),(2,-2,0,-1,302),
(0,0,1,3,-283),(2,1,1,-1,-229),(1,1,0,-1,223),(1,1,0,1,223),
(0,1,-2,-1,-220),(2,1,-1,-1,-220),(1,0,1,1,-185),(2,-1,-2,-1,181),
(0,1,2,1,-177),(4,0,-2,-1,176),(4,-1,-1,-1,166),(1,0,1,-1,-164),
(4,0,1,-1,132),(1,0,-1,-1,-119),(4,-1,0,-1,115),(2,-2,0,1,107),
]

def moon_sun(jd):
    T = (jd - 2451545.0) / 36525.0
    Lp = 218.3164477 + 481267.88123421*T - 0.0015786*T*T + T**3/538841 - T**4/65194000
    D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + T**3/545868 - T**4/113065000
    M  = 357.5291092 + 35999.0502909*T - 0.0001536*T*T + T**3/24490000
    Mp = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + T**3/69699 - T**4/14712000
    F  = 93.2720950 + 483202.0175233*T - 0.0036539*T*T - T**3/3526000 + T**4/863310000
    A1 = 119.75 + 131.849*T
    A2 = 53.09 + 479264.290*T
    A3 = 313.45 + 481266.484*T
    E  = 1 - 0.002516*T - 0.0000074*T*T
    E2 = E*E
    sl = sr = sb = 0.0
    for (d,m,mp,f,cl,cr,cb) in TERMS:
        arg = (d*D + m*M + mp*Mp + f*F) * D2R
        e = E2 if abs(m)==2 else (E if abs(m)==1 else 1.0)
        sl += cl * e * math.sin(arg)
        sr += cr * e * math.cos(arg)
    for (d,m,mp,f,cb) in SB_TERMS:
        arg = (d*D + m*M + mp*Mp + f*F) * D2R
        e = E2 if abs(m)==2 else (E if abs(m)==1 else 1.0)
        sb += cb * e * math.sin(arg)
    sl += 3958*math.sin(A1*D2R) + 1962*math.sin((Lp-F)*D2R) + 318*math.sin(A2*D2R)
    sb += -2235*math.sin(Lp*D2R) + 382*math.sin(A3*D2R) + 175*math.sin((A1-F)*D2R) \
          + 175*math.sin((A1+F)*D2R) + 127*math.sin((Lp-Mp)*D2R) - 115*math.sin((Lp+Mp)*D2R)
    lam_m = (Lp + sl/1e6) % 360
    bet_m = sb / 1e6
    dist_m = 385000.56 + sr/1000  # km
    # Sun (Meeus ch.25, low precision ~0.01 deg)
    L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T
    Ms = 357.52911 + 35999.05029*T - 0.0001537*T*T
    C = (1.914602 - 0.004817*T - 0.000014*T*T)*math.sin(Ms*D2R) \
        + (0.019993 - 0.000101*T)*math.sin(2*Ms*D2R) + 0.000289*math.sin(3*Ms*D2R)
    lam_s = (L0 + C) % 360
    dist_s = (1.000001018*(1-0.016708634**2)/(1+0.016708634*math.cos((Ms+C)*D2R))) * 149597870.7
    eps = 23.4392911 - 0.0130042*T
    return lam_m, bet_m, dist_m, lam_s, dist_s, eps

def ecl_to_eq(lam, bet, eps):
    l, b, e = lam*D2R, bet*D2R, eps*D2R
    ra = math.atan2(math.sin(l)*math.cos(e) - math.tan(b)*math.sin(e), math.cos(l)) * R2D % 360
    dec = math.asin(math.sin(b)*math.cos(e) + math.cos(b)*math.sin(e)*math.sin(l)) * R2D
    return ra, dec

def gmst(jd):
    T = (jd - 2451545.0)/36525.0
    th = 280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T - T**3/38710000
    return th % 360

def altaz(jd, lat, lon, ra, dec):
    H = (gmst(jd) + lon - ra) % 360
    if H > 180: H -= 360
    h, d, p = H*D2R, dec*D2R, lat*D2R
    alt = math.asin(math.sin(p)*math.sin(d) + math.cos(p)*math.cos(d)*math.cos(h)) * R2D
    az = math.atan2(-math.cos(d)*math.sin(h),
                    math.sin(d)*math.cos(p) - math.cos(d)*math.sin(p)*math.cos(h)) * R2D % 360
    return alt, az

CST = timezone(timedelta(hours=8))
LAT, LON = 28.19, 112.98   # Changsha

def report(dt_local):
    dt_utc = dt_local.astimezone(timezone.utc)
    jd = jd_from_utc(dt_utc)
    lm, bm, dm, ls, ds, eps = moon_sun(jd)
    ram, decm = ecl_to_eq(lm, bm, eps)
    ras, decs = ecl_to_eq(ls, 0.0, eps)
    alt, az = altaz(jd, LAT, LON, ram, decm)
    # elongation & phase angle
    cospsi = math.sin(decs*D2R)*math.sin(decm*D2R) + math.cos(decs*D2R)*math.cos(decm*D2R)*math.cos((ras-ram)*D2R)
    psi = math.acos(max(-1,min(1,cospsi))) * R2D
    i = math.atan2(ds*math.sin(psi*D2R), dm - ds*math.cos(psi*D2R)) * R2D
    k = (1 + math.cos(i*D2R))/2
    age = (lm - ls) % 360 / 360 * 29.530588853
    print(f"{dt_local.strftime('%m-%d %H:%M')} CST | az={az:6.1f} deg  alt={alt:5.1f} deg | "
          f"illum={k*100:4.1f}%  elong={psi:5.1f}  age~{age:4.1f}d  dist={dm:,.0f}km  dec={decm:+.1f}")
    return az, alt, k

print("=== Changsha (28.19N 112.98E), 2026-11-21 evening ===")
for hhmm in [(18,30),(19,0),(19,30),(20,0)]:
    report(datetime(2026,11,21,hhmm[0],hhmm[1],tzinfo=CST))

# cross-check: moonrise / transit / moonset on Nov 21 (local), scan minute-by-minute
print("\n=== rise/transit/set check (expect ~14:53 az80 / 21:25 alt72.2 / 03:02+1 az277) ===")
prev_alt = None; prev_az = None
transit = None; best_alt = -90
for mins in range(0, 30*60):  # Nov21 00:00 .. Nov22 06:00
    dt = datetime(2026,11,21,0,0,tzinfo=CST) + timedelta(minutes=mins)
    jd = jd_from_utc(dt.astimezone(timezone.utc))
    lm, bm, dm, ls, ds, eps = moon_sun(jd)
    ram, decm = ecl_to_eq(lm, bm, eps)
    alt, az = altaz(jd, LAT, LON, ram, decm)
    if prev_alt is not None:
        if prev_alt < 0 <= alt:
            print(f"moonrise ~ {dt.strftime('%m-%d %H:%M')} az={az:.0f}")
        if prev_alt > 0 >= alt:
            print(f"moonset  ~ {dt.strftime('%m-%d %H:%M')} az={az:.0f}")
    if alt > best_alt and dt.day == 21:
        best_alt = alt; transit = (dt, alt, az)
    prev_alt = alt
if transit:
    print(f"transit  ~ {transit[0].strftime('%m-%d %H:%M')} alt={transit[1]:.1f}")

# previous new moon (scan back for min elongation)
print("\n=== previous new moon scan ===")
best = None
for hrs in range(0, 32*24):
    dt = datetime(2026,11,21,19,0,tzinfo=CST) - timedelta(hours=hrs)
    jd = jd_from_utc(dt.astimezone(timezone.utc))
    lm, bm, dm, ls, ds, eps = moon_sun(jd)
    elong = (lm - ls) % 360
    if elong > 180: elong -= 360
    if best is None or abs(elong) < abs(best[1]):
        best = (dt, elong)
print(f"new moon ~ {best[0].strftime('%Y-%m-%d %H:%M')} CST (elong {best[1]:+.2f} deg)  [expect Nov 9 ~15:02]")
