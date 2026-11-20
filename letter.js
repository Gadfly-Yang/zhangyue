/* 一封情书。枝干构图改编自 sun0225sun/Awesome-Love-Code (Web/003)。 */
(function (window) {
  "use strict";

  const WIDTH = 960;
  const HEIGHT = 680;
  const PORTRAIT_WIDTH = 430;
  const PORTRAIT_HEIGHT = 890;
  const GROUND = 625;
  const INTRO = 4.45;
  const CROSSFADE = 0.65;
  const TAU = Math.PI * 2;
  const ROSE = ["#9d304b", "#bc3f59", "#d4516f", "#ea6c87", "#f18ba1", "#f8a7b7", "#ffc1c7"];
  const GREENS = ["#315842", "#406c4c", "#527d4c", "#6d914e", "#86a758", "#acc369", "#cdd680"];

  // Each branch follows the trunk upwards, then grows into its own fork.
  const BRANCHES = [
    [480, GROUND, 515, 250, 445, 200, 25, .65, .82, 1.56],
    [485, 500, 400, 417, 285, 400, 9, .65, 1.16, .88],
    [495, 445, 545, 356, 625, 345, 9, .7, 1.28, .99],
    [491, 397, 358, 247, 273, 244, 7, .5, 1.42, 1.03],
    [491, 357, 553, 252, 623, 221, 5, .6, 1.52, .95],
    [398, 437, 375, 429, 339, 380, 2.5, .3, 1.78, .54],
    [554, 376, 593, 390, 606, 426, 3, .4, 1.92, .51],
    [388, 298, 350, 256, 316, 205, 3, .4, 2.02, .56],
    [443, 345, 409, 308, 341, 326, 3.7, .4, 1.84, .58],
    [534, 288, 577, 275, 593, 271, 2.6, .35, 2.15, .50],
    [478, 280, 486, 242, 479, 211, 3.4, .35, 1.97, .63]
  ];

  function unit(value) { return Math.max(0, Math.min(1, value)); }
  function mix(from, to, amount) { return from + (to - from) * amount; }
  function smooth(value) {
    const t = unit(value);
    return t * t * (3 - 2 * t);
  }
  function progress(time, start, duration) { return unit((time - start) / duration); }

  function randomSource(seed) {
    return function () {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
    ctx.fill();
  }

  function layer(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);
    return canvas.getContext("2d");
  }

  function drawBranch(ctx, branch, amount) {
    if (amount <= 0) return;
    const [x0, y0, x1, y1, x2, y2, base, tip] = branch;
    const steps = Math.ceil(32 * amount);
    const edges = [[], []];
    for (let i = 0; i <= steps; i++) {
      const t = amount * i / steps;
      const q = 1 - t;
      const x = q * q * x0 + 2 * q * t * x1 + t * t * x2;
      const y = q * q * y0 + 2 * q * t * y1 + t * t * y2;
      const dx = q * (x1 - x0) + t * (x2 - x1);
      const dy = q * (y1 - y0) + t * (y2 - y1);
      const radius = mix(base, tip, t) * mix(1, .24, Math.pow(i / steps, 10) * (1 - amount));
      const normal = radius / Math.hypot(dx, dy);
      edges[0].push([x - dy * normal, y + dx * normal]);
      edges[1].push([x + dy * normal, y - dx * normal]);
    }
    const ribbon = edges[0].concat(edges[1].reverse());
    const bark = ctx.createLinearGradient(x0 - base, y0, x0 + base * 1.5, y0 - 28);
    bark.addColorStop(0, "#724739");
    bark.addColorStop(.52, "#97654e");
    bark.addColorStop(1, "#ad8060");
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(...ribbon[0]);
    for (let i = 1; i < ribbon.length; i++) ctx.lineTo(...ribbon[i]);
    ctx.closePath();
    ctx.fill();
  }

  function drawWood(ctx, time) {
    const root = smooth((time - .8) / .38);
    if (root > 0) {
      ctx.save();
      ctx.globalAlpha = root;
      ctx.fillStyle = "#85563f";
      ctx.beginPath();
      ctx.moveTo(466, GROUND - 31);
      ctx.bezierCurveTo(462, GROUND - 9, 451, GROUND - 4, 426, GROUND + 3);
      ctx.bezierCurveTo(455, GROUND + 3, 470, GROUND - 2, 485, GROUND + 1);
      ctx.bezierCurveTo(500, GROUND - 1, 509, GROUND + 1, 535, GROUND + 4);
      ctx.bezierCurveTo(515, GROUND - 3, 503, GROUND - 12, 496, GROUND - 32);
      ctx.fill();
      ctx.restore();
    }
    // Paint the trunk over the lower fork so their shared base reads as a single form.
    for (const branch of [...BRANCHES.slice(1), BRANCHES[0]]) {
      const t = progress(time, branch[8], branch[9]);
      drawBranch(ctx, branch, t * (2 - t));
    }
    const grain = smooth((time - 1.02) / .62);
    ctx.strokeStyle = "rgba(90,52,43," + grain * .19 + ")";
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(473, GROUND - 5);
    ctx.quadraticCurveTo(477, GROUND - 21, 477, GROUND - 25 - grain * 67);
    ctx.moveTo(498, GROUND - 11);
    ctx.quadraticCurveTo(493, GROUND - 23, 495, GROUND - 18 - grain * 39);
    ctx.stroke();
  }

  function heartPath() {
    const shape = new Path2D();
    shape.moveTo(0, .94);
    shape.bezierCurveTo(-1.85, -.12, -.83, -1.35, 0, -.62);
    shape.bezierCurveTo(.83, -1.35, 1.85, -.12, 0, .94);
    return shape;
  }

  function makeBlossoms(random) {
    const blossoms = [];
    while (blossoms.length < 720) {
      const u = mix(-1.15, 1.15, random());
      const v = mix(-1, 1.26, random());
      if (Math.pow(u * u + v * v - 1, 3) >= u * u * v * v * v) continue;
      const x = 480 + u * 257;
      const y = 347 - v * 257;
      const branch = Math.min(...BRANCHES.slice(1).map(b => Math.hypot(x - b[4], y - b[5])));
      blossoms.push({
        x, y, size: mix(5, 17, Math.pow(random(), .75)),
        color: ROSE[Math.floor(random() * ROSE.length)], alpha: mix(.49, .92, random()),
        angle: mix(-1.4, 1.4, random()),
        start: 1.96 + unit(branch / 224) * .83 + unit((325 - y) / 250) * .39 + random() * .49
      });
    }
    return blossoms.sort((a, b) => a.start - b.start);
  }

  function paintHeart(ctx, shape, x, y, size, angle, color, width = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size * width, size);
    ctx.fillStyle = color;
    ctx.fill(shape);
    ctx.restore();
  }

  function drawBlossoms(ctx, shape, blossoms, time) {
    ctx.save();
    const alpha = ctx.globalAlpha;
    for (const flower of blossoms) {
      if (flower.start >= time) break;
      const open = smooth((time - flower.start) / .54);
      ctx.globalAlpha = open * flower.alpha * alpha;
      paintHeart(ctx, shape, flower.x, flower.y + (1 - open) * 4,
        flower.size * mix(.24, 1, open), flower.angle + (1 - open) * .34, flower.color);
    }
    ctx.restore();
  }

  function drawSeed(ctx, shape, time) {
    if (time >= .86) return;
    const t = progress(time, .19, .67);
    ctx.save();
    ctx.globalAlpha = 1 - smooth((t - .92) / .08);
    paintHeart(ctx, shape, mix(470, 480, t), mix(342, GROUND, t * t),
      mix(28, 3.5, smooth(t * 1.4)), -.14 * Math.sin(t * Math.PI), "#be3b59");
    ctx.restore();
  }

  function drawGround(ctx, summer, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(478, GROUND + 4);
    ctx.scale(327, 34);
    const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    shade.addColorStop(0, summer ? "#6785516a" : "#aa5d6557");
    shade.addColorStop(.57, summer ? "#85a76b35" : "#c98b8135");
    shade.addColorStop(1, summer ? "#85a76b00" : "#c98b8100");
    ellipse(ctx, 0, 0, 1, 1, shade);
    ctx.restore();
  }

  function makePetal(flower, time, random, gust) {
    return {
      x: flower.x, y: flower.y, start: time, size: mix(4, 8.5, random()),
      color: flower.color, angle: flower.angle, phase: random() * TAU,
      duration: mix(3.5, 6, random()), sway: mix(12, 28, random()),
      drift: mix(13, 44, random()) + (gust ? 150 : 0), rate: 12, summer: false
    };
  }

  // 夏天的落叶：仍是心形，换成叶绿色，从树冠簇里随机飘出
  function makeSummerLeaf(time, random, gust) {
    const c = CANOPY_LAYOUT[Math.floor(random() * CANOPY_LAYOUT.length)];
    return {
      x: c[0] + (random() - .5) * c[2] * 1.5,
      y: c[1] + (random() - .15) * c[3] * 1.3,
      start: time, size: mix(4.5, 8.2, random()),
      color: GREENS[2 + Math.floor(random() * 5)],
      angle: mix(-1.4, 1.4, random()), phase: random() * TAU,
      duration: mix(4.4, 7.2, random()), sway: mix(14, 30, random()),
      drift: mix(8, 30, random()) + (gust ? 110 : 0), rate: 7, summer: true
    };
  }

  function drawPetal(ctx, heart, petal, time, season) {
    const age = time - petal.start;
    if (age < 0) return;
    const t = unit(age / petal.duration);
    const y = mix(petal.y, GROUND + 6, Math.pow(t, 1.13));
    const sway = Math.sin(age * 2.5 + petal.phase) - Math.sin(petal.phase);
    const x = petal.x + petal.drift * (1 - Math.exp(-age * .9)) + age * petal.rate + sway * petal.sway;
    const flip = .24 + .76 * Math.abs(Math.cos(age * 3.1 + petal.phase));
    const fade = petal.summer ? Math.min(1, season * 1.15) : (1 - season);
    ctx.save();
    ctx.globalAlpha = .86 * smooth(age / .25) * (1 - smooth((age - petal.duration) / 1.15)) * fade;
    paintHeart(ctx, heart, x, y, petal.size, petal.angle + age * .64 + sway * .28, petal.color, flip);
    ctx.restore();
  }

  function leafPath() {
    const shape = new Path2D();
    shape.moveTo(-1, 0);
    shape.quadraticCurveTo(-.25, -.84, 1, -.08);
    shape.quadraticCurveTo(.11, .81, -1, 0);
    return shape;
  }

  // Rear shade first, then the sunlit clusters across the upper branches.
  const CANOPY_LAYOUT = [
    [357, 329, 124, 78, 0], [463, 342, 116, 93, 0], [582, 342, 118, 95, 0],
    [675, 302, 103, 88, 1], [277, 284, 86, 71, 1], [358, 266, 113, 97, 1],
    [521, 267, 122, 100, 0], [641, 234, 107, 87, 1], [728, 251, 79, 68, 2],
    [290, 226, 86, 65, 2], [391, 203, 118, 81, 2], [503, 217, 109, 93, 2],
    [583, 182, 105, 74, 2], [680, 177, 79, 55, 3], [449, 150, 103, 65, 3],
    [542, 143, 94, 58, 3], [359, 166, 86, 55, 3]
  ];

  function makeCanopy(leaf, random, colors = GREENS, density = 145) {
    return CANOPY_LAYOUT.map(([x, y, rx, ry, tone], index) => {
      const margin = 24;
      const originX = rx + margin, originY = ry + margin;
      const sprite = layer(2 * originX, 2 * originY);
      sprite.translate(originX, originY);
      sprite.save();
      sprite.scale(rx, ry);
      const mass = sprite.createRadialGradient(-.13, -.12, .12, 0, 0, 1);
      mass.addColorStop(0, colors[tone + 1]);
      mass.addColorStop(.7, colors[tone + 1] + (density < 100 ? "88" : "ed"));
      mass.addColorStop(1, colors[tone + 1] + "00");
      ellipse(sprite, 0, 0, 1, 1, mass);
      sprite.restore();
      for (let i = 0; i < density; i++) {
        const angle = random() * TAU;
        const edge = .91 + .13 * Math.cos(angle * 5 + index);
        const radius = Math.sqrt(random()) * edge;
        const palette = Math.min(colors.length - 1, tone + Math.floor(random() * 4));
        const size = mix(5, 19, random());
        paintHeart(sprite, leaf, Math.cos(angle) * radius * rx, Math.sin(angle) * radius * ry,
          size, mix(-1, 1, random()), colors[palette], mix(.8, 1.35, random()));
      }
      return { x, y, originX, originY, image: sprite.canvas, phase: index * .61 };
    });
  }

  function wind(time) {
    return Math.sin(time * 1.42) * .56 + Math.sin(time * .66 - .38) * .44;
  }

  function drawCanopy(ctx, canopy, time, season, gust, still) {
    ctx.save();
    ctx.globalAlpha = season;
    for (const cluster of canopy) {
      const strength = still ? 0 : wind(time - cluster.phase * .21) + gust * 1.1;
      const bend = strength * (cluster.y < 220 ? .039 : .027);
      ctx.save();
      ctx.translate(cluster.x, cluster.y + 34);
      ctx.rotate(bend);
      ctx.translate(strength * 3.3, -34);
      ctx.drawImage(cluster.image, -cluster.originX, -cluster.originY);
      ctx.restore();
    }
    ctx.restore();
  }

  function makeMeadow(random) {
    return Array.from({ length: 105 }, () => ({
      x: mix(133, 836, random()), y: mix(613, 657, random()), height: mix(3, 14, random()),
      color: GREENS[2 + Math.floor(random() * 4)], phase: random() * TAU, flower: random() < .16
    })).filter(plant => plant.x < 146 || plant.x > 304);
  }

  function drawMeadow(ctx, meadow, time, gust) {
    for (const plant of meadow) {
      const bend = (Math.sin(time * 2.2 + plant.phase) * .22 + gust * .28) * plant.height;
      const { x, y, height } = plant;
      ctx.strokeStyle = plant.color;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + bend * .1, y - height * .76, x + bend + 2, y - height);
      ctx.stroke();
      if (plant.flower) {
        ellipse(ctx, x + bend + 2, y - height, 3.5, 1.9, "#fffae0", -.32);
        ellipse(ctx, x + bend + 2, y - height, 1.1, 1, "#ceaa5f");
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 15; i++) {
      const phase = i * 1.7;
      ellipse(ctx, 390 + i * 22 + Math.sin(time * 1.3 + phase) * 9,
        GROUND + Math.sin(phase * 2) * 13, 5 + (i % 4) * 5, 1 + i % 3,
        "rgba(246,225,150," + (.18 + .15 * Math.sin(time * 1.2 + phase)) + ")", -.1);
    }
    ctx.restore();
  }

  function drawSummerAir(ctx, leaf, time, gust, still) {
    for (let i = 0; i < 7; i++) {
      const t = (time * (.09 + i * .003) + i * .317) % 1;
      const x = 350 + i * 44 + t * (135 + gust * 45) + Math.sin(t * TAU * 2 + i) * 17;
      const y = 246 + i * 21 + t * 148;
      ctx.save();
      ctx.globalAlpha *= .9 * smooth(t / .14) * smooth((1 - t) / .24);
      paintHeart(ctx, leaf, x, y, 4.5 + i % 3, t * 5 + i, GREENS[4 + i % 3],
        .3 + .7 * Math.abs(Math.cos(t * 21 + i)));
      ctx.restore();
    }
    for (let i = 0; i < 2; i++) {
      const t = time * (.91 + i * .19) + i * 1.8;
      const x = 683 + i * 75 + 43 * Math.cos(t);
      const y = 539 + i * 24 + 17 * Math.sin(t * 1.3);
      const flap = still ? 1 : .28 + .72 * Math.abs(Math.sin(t * 16));
      const hue = i === 0 ? "#e9b65e" : "#faf5cc";
      ellipse(ctx, x - 3 * flap, y - 2, 4.8 * flap, 2.8, hue, .65);
      ellipse(ctx, x + 3 * flap, y - 2, 4.8 * flap, 2.8, hue, -.65);
      ellipse(ctx, x, y, .75, 2.9, "#7d6548", -.12);
    }
  }

  // 用二次曲线画肢体：肩→肘(控制点)→腕，比折线圆润
  function limb(ctx, color, width, from, ctrl, to) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.quadraticCurveTo(ctrl[0], ctrl[1], to[0], to[1]);
    ctx.stroke();
  }

  function during(time, start, end, fade = .035) {
    return smooth((time - start) / fade) * smooth((end - time) / fade);
  }

  // Two fixed-length segments keep a knee or elbow bent toward its anatomical side.
  function articulatedJoint(from, target, upper, lower, bend) {
    const dx = target[0] - from[0], dy = target[1] - from[1];
    const length = Math.max(.001, Math.hypot(dx, dy));
    const distance = Math.max(Math.abs(upper - lower) + .02, Math.min(upper + lower - .02, length));
    const ux = dx / length, uy = dy / length;
    const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const out = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
    return {
      middle: [from[0] + ux * along + uy * out, from[1] + uy * along - ux * out],
      end: [from[0] + ux * distance, from[1] + uy * distance]
    };
  }

  function taperedSegment(ctx, from, to, base, tip, color) {
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    ctx.save();
    ctx.translate(...from);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -base);
    ctx.quadraticCurveTo(len * .46, -base * 1.06, len, -tip);
    ctx.arc(len, 0, tip, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(len * .56, base * .9, 0, base);
    ctx.arc(0, 0, base, Math.PI / 2, 1.5 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  function drawSummerPerson(ctx, opts) {
    const { x, woman, scale, facing, walk, stride, sit, greeting, speaking, look, point,
      holding, handX, handY, breeze, lean, reach, reachW, time, seed, still } = opts;
    const skin = woman ? "#c98d6c" : "#b57e61";
    const skinShade = woman ? "#ab7356" : "#96644c";
    const shirt = opts.clothes ? opts.clothes[0] : (woman ? "#efb96f" : "#74947f");
    const trim = opts.clothes ? opts.clothes[1] : (woman ? "#d99e55" : "#5f7f6d");
    const scarf = opts.clothes && opts.clothes[2];
    const dark = opts.clothes ? opts.clothes[3] : (woman ? "#77534a" : "#3d5b52");
    const hairC = woman ? "#5d3b31" : "#41493f";
    const inner = woman ? -1 : 1;                 // 靠近伴侣的一侧
    const gesture = opts.gesture || {};
    const nod = gesture.nod || 0, settle = gesture.settle || 0;
    const bob = walk * (1 - Math.cos(2 * stride)) * .8;
    const idle = still ? 0 : Math.sin(time * 1.5 + seed);   // 站立时的轻微呼吸起伏
    const hipY = mix(-42.2, -9, sit) - bob + idle * .36 + settle * 1.8;
    const hipX = facing * sit * -3 + walk * Math.sin(stride) * 1.2 + idle * .38
      + inner * (1 - sit) * (1 - walk) * 1.2;
    const shoulderX = hipX + facing * (sit * 5 + walk * (3 + (opts.run || 0) * 5)) + inner * lean * 9;
    const shoulderY = hipY - 30 + sit * 2 + lean * 3.5;

    ellipse(ctx, x + hipX * scale, GROUND + 1, 16 + 7 * sit, 4.3, "#59684238");
    ctx.save();
    ctx.translate(x, GROUND);
    ctx.scale(scale, scale);

    // 腿：膝盖用曲线过渡；远侧腿颜色深一档
    for (const side of [-1, 1]) {
      const cycle = stride + (side === -1 ? Math.PI : 0);
      const step = Math.sin(cycle) * walk * (1 + (opts.run || 0) * .38);
      const hipPt = [hipX + side * 4.5, hipY + 2];
      const foot = [mix(side * 8.5 + step * 13, facing * (20 + side * 5.5), sit),
        -1.5 - Math.max(0, Math.cos(cycle)) * walk * 7];
      const leg = articulatedJoint(hipPt, foot, 20.4, 19.3, facing);
      const cloth = woman && !scarf ? (side < 0 ? skinShade : skin) : dark;
      taperedSegment(ctx, hipPt, leg.middle, woman ? 4.25 : 5.1, 3.2, cloth);
      taperedSegment(ctx, leg.middle, leg.end, 3.25, woman ? 1.9 : 2.7, cloth);
      const heel = leg.end;
      const roll = walk * Math.cos(cycle) * .36;
      ctx.save();
      ctx.translate(...heel);
      ctx.rotate(roll);
      ellipse(ctx, facing * 2.5, -.1, 5.1, 2.05, woman ? "#79513f" : "#42463d", -.04 * facing);
      ctx.restore();
    }

    // 手臂姿态：放松 / 挥手 / 指向 / 牵手 / 搂肩 按权重混合，动作之间自然过渡
    function armPose(side) {
      const isInner = side === inner;
      const sh = [shoulderX + side * 7.5, shoulderY + 3.5];
      const swing = Math.sin(stride + side * Math.PI / 2) * walk;
      const wWave = isInner ? greeting : 0;
      const wPoint = isInner ? point : 0;
      const wHold = isInner ? holding : 0;
      const wReach = isInner && reach ? reachW : 0;
      const talkingHand = !isInner ? speaking * (opts.clothes ? 1 : .35) : 0;
      const bx = sh[0] + side * (3.5 + talkingHand * 8) - swing * 9 + sit * (isInner ? 7 : 4);
      const by = sh[1] + mix(28.5, 12, sit) + idle * .6 - talkingHand * 14;
      let wx = bx, wy = by;
      const wSum = wWave + wPoint + wHold + wReach;
      if (wSum > 0) {
        let tx = 0, ty = 0;
        if (wWave > 0) {
          const flap = still ? .35 : Math.sin(time * 8.5 + seed);
          tx += wWave * (sh[0] + side * 9 + flap * 4.5);
          ty += wWave * (sh[1] - 31);
        }
        if (wPoint > 0) {
          tx += wPoint * (sh[0] + facing * 25);
          ty += wPoint * (sh[1] - 29);
        }
        if (wHold > 0) {
          tx += wHold * ((handX - x) / scale);
          ty += wHold * (handY / scale);
        }
        if (wReach > 0) { tx += wReach * reach[0]; ty += wReach * reach[1]; }
        const k = Math.min(1, wSum);
        wx = mix(bx, tx / wSum, k);
        wy = mix(by, ty / wSum, k);
      }
      // The free hand can fix a collar, shield the eyes or tuck a lock of hair.
      if (!isInner) {
        const marks = [
          [gesture.hair, side * 5, -11], [gesture.collar, facing * 2, 1],
          [gesture.shade, facing * 10, -17], [gesture.offer, facing * 21, 11],
          [gesture.heart, -side * 2, 8]
        ];
        for (const [weight, tx, ty] of marks) {
          if (!weight) continue;
          wx = mix(wx, shoulderX + tx, weight);
          wy = mix(wy, shoulderY + ty, weight);
        }
      }
      const arm = articulatedJoint(sh, [wx, wy], 15.7, 15.2, side);
      return { sh, elbow: arm.middle, wrist: arm.end };
    }
    function drawArm(side) {
      const pose = armPose(side);
      const sleeve = [mix(pose.sh[0], pose.elbow[0], .55), mix(pose.sh[1], pose.elbow[1], .55)];
      taperedSegment(ctx, pose.sh, pose.elbow, scarf ? 3.65 : 2.8, scarf ? 2.9 : 2.15, scarf ? shirt : skin);
      taperedSegment(ctx, pose.elbow, pose.wrist, scarf ? 3.0 : 2.15, scarf ? 2.35 : 1.45, scarf ? shirt : skin);
      taperedSegment(ctx, pose.sh, sleeve, 3.95, 3.15, shirt);
      if (side === inner && opts.phone > 0) {
        ctx.save();
        ctx.globalAlpha *= opts.phone;
        ctx.translate(pose.wrist[0], pose.wrist[1] - 3);
        ctx.rotate(-side * .21);
        ctx.fillStyle = "#414b58";
        ctx.fillRect(-2.5, -4.6, 5, 9.2);
        ctx.fillStyle = "#d4e2d5";
        ctx.fillRect(-1.6, -3.4, 3.2, 5.5);
        ctx.restore();
      }
      const wristAngle = Math.atan2(pose.wrist[1] - pose.elbow[1], pose.wrist[0] - pose.elbow[0]);
      ellipse(ctx, pose.wrist[0], pose.wrist[1], 2.65, 1.65, skin, wristAngle);
      if (gesture.leaf && side === -inner) {
        ctx.save();
        ctx.globalAlpha *= gesture.leaf;
        ellipse(ctx, pose.wrist[0] + facing * 3, pose.wrist[1] - 3, 4.2, 1.65, "#bf783a", -.6);
        ctx.restore();
      }   // 圆润的手
    }

    drawArm(-inner);   // 远侧手臂（在躯干后面）

    // 躯干：女生连衣裙（波浪裙摆，随风轻摆）+ 腰带；男生衬衫 + 圆领
    const sh = shoulderX + facing * 1.2;
    const fabric = ctx.createLinearGradient(sh - 12, shoulderY, sh + 13, shoulderY + 3);
    fabric.addColorStop(0, trim);
    fabric.addColorStop(.45, shirt);
    fabric.addColorStop(1, shirt);
    if (woman) {
      const hemY = mix(hipY + 23, hipY + 8, sit);
      const flare = mix(15.5, 13, sit) + (still ? 0 : breeze) * 1.7 + walk * Math.sin(stride) * 2.2;
      ctx.fillStyle = fabric;
      ctx.beginPath();
      ctx.moveTo(sh - 7.6, shoulderY - 3);
      ctx.quadraticCurveTo(sh, shoulderY - 8.2, sh + 7.8, shoulderY - 3);
      ctx.quadraticCurveTo(sh + 8.6, shoulderY + 9, hipX + 7.4, hipY - 2);
      ctx.quadraticCurveTo(hipX + 12, hipY + 9, hipX + flare, hemY);
      ctx.quadraticCurveTo(hipX + flare * .5, hemY + 3.6, hipX, hemY + 2.2);
      ctx.quadraticCurveTo(hipX - flare * .5, hemY + 3.8, hipX - flare, hemY);
      ctx.quadraticCurveTo(hipX - 12, hipY + 9, hipX - 7.4, hipY - 2);
      ctx.quadraticCurveTo(sh - 8.6, shoulderY + 9, sh - 7.6, shoulderY - 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 2.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hipX - 7.8, hipY - 2.6);
      ctx.quadraticCurveTo(hipX, hipY + .9, hipX + 7.8, hipY - 2.6);
      ctx.stroke();
    } else {
      ctx.fillStyle = fabric;
      ctx.beginPath();
      ctx.moveTo(sh - 9, shoulderY - 2);
      ctx.quadraticCurveTo(sh, shoulderY - 8.6, sh + 9, shoulderY - 2);
      ctx.quadraticCurveTo(sh + 10, shoulderY + 11, hipX + 9.2, hipY);
      ctx.quadraticCurveTo(hipX, hipY + 3.6, hipX - 9.2, hipY);
      ctx.quadraticCurveTo(shoulderX - 10, shoulderY + 11, sh - 9, shoulderY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sh - 3.2 + facing * 2.4, shoulderY - 5.8);
      ctx.quadraticCurveTo(sh + facing * 2.4, shoulderY - 2.2, sh + 3.4 + facing * 2.4, shoulderY - 5.6);
      ctx.stroke();
    }

    if (woman) {
      limb(ctx, trim, .8, [hipX + 2, hipY], [hipX + 4, hipY + 5], [hipX + 5, hipY + mix(16, 4, sit)]);
    } else {
      const placket = sh + facing * 2;
      limb(ctx, trim, .65, [placket, shoulderY - 2], [placket, shoulderY + 9], [hipX + facing * 2, hipY - 2]);
      for (let i = 0; i < 3; i++) ellipse(ctx, placket, shoulderY + 3 + i * 6.2, .73, .73, "#f3e5ce");
    }
    const freeHand = Math.max(gesture.hair || 0, gesture.collar || 0, gesture.shade || 0,
      gesture.offer || 0, gesture.heart || 0);
    if (freeHand > 0) {
      ctx.save();
      ctx.globalAlpha *= freeHand;
      drawArm(-inner);
      ctx.restore();
    }
    drawArm(inner);

    // 脖子 + 头：会眨眼、微笑、说话、抬头看日月、依偎时歪头
    const headX = shoulderX + facing * 2 + inner * lean * 5;
    const headY = shoulderY - 15.5 + lean * 2.6;
    limb(ctx, skin, 5, [shoulderX, shoulderY - 4],
      [(shoulderX + headX) / 2 + facing * .8, (shoulderY - 4 + headY) / 2], [headX, headY]);
    if (scarf) {
      const flutter = still ? 0 : breeze * 4;
      limb(ctx, scarf, 5.3, [shoulderX - 6, shoulderY - 5],
        [shoulderX, shoulderY], [shoulderX + 6, shoulderY - 5]);
      limb(ctx, scarf, 4.6, [shoulderX - facing * 3, shoulderY - 4],
        [shoulderX - facing * 10 + flutter, shoulderY + 2], [shoulderX - facing * 11 + flutter, shoulderY + 13]);
    }
    ctx.save();
    ctx.translate(headX, headY);
    const rot = -facing * .32 * look + inner * lean * .24 + nod * facing * .14
      + (still ? 0 : idle * .021 + speaking * Math.sin(time * 4.7) * .045);
    ctx.rotate(rot);
    const hairWind = still ? 0 : breeze * 1.8 + walk * Math.sin(stride - .65) * 1.4;
    const back = -facing;
    if (woman) {
      // Low ponytail, with a loose end that follows the head a fraction later.
      const tie = [back * 7.5, -.2];
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.moveTo(tie[0], -2.8);
      ctx.bezierCurveTo(back * 15, -1, back * 9, 12, back * 14 + hairWind, 17);
      ctx.bezierCurveTo(back * 6 + hairWind, 15, back * 5, 8, tie[0] - back * 2, 1);
      ctx.fill();
      ellipse(ctx, ...tie, 2.1, 1.4, trim, -.4 * facing);
    }
    const chin = facing * 1.8;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-6.9, -4.1);
    ctx.bezierCurveTo(-7.1, -11, 6.8, -12.6, 7.1, -3.6);
    ctx.bezierCurveTo(7.6, 2.4, 5.2 + chin, 7.5, chin, 8.2);
    ctx.quadraticCurveTo(-6.4, 7.2, -6.9, -4.1);
    ctx.fill();
    ellipse(ctx, 6.35 * facing, .7, 1.6, 1.2, skin);
    ctx.fillStyle = hairC;
    ctx.beginPath();
    ctx.moveTo(-7.1, 1 - 2.8 * facing);
    ctx.bezierCurveTo(-10.8, -11.5, -2.4, -13.5, 2.9, -10.7);
    ctx.quadraticCurveTo(9.4, -10.5, 8.1, .4 + 2.8 * facing);
    ctx.quadraticCurveTo(4.8, -1.8 + 2 * facing, 4.7, -5.2);
    ctx.quadraticCurveTo(.5, -3.7, -2.2, -5.8);
    ctx.quadraticCurveTo(-5.4, -5.2, -7.1, 1 - 2.8 * facing);
    ctx.fill();
    ellipse(ctx, -4.7 * facing, 1.5, 1.6, 2.1, skinShade);
    limb(ctx, woman ? "#805942" : "#596052", .85, [-5.4, -7.4], [-2.3, -11.4], [2.7, -9.6]);
    const gaze = facing * 3.4;
    const eyeY = -.8 - look * .8;
    const blink = still ? 0 : smooth(1 - Math.abs(((time + seed) % 4.3) - 4.13) / .12);
    limb(ctx, hairC, .8, [gaze - 1.2, eyeY -.2], [gaze, eyeY - .5], [gaze + 1.1, eyeY]);
    if (!opts.eyesClosed) ellipse(ctx, gaze + .35 * facing, eyeY + .17, .64, .16 + .72 * (1 - blink), "#3c302d");
    if (woman) ellipse(ctx, 2.3 * facing, 2.2, 1.8, .85, "#db9582");
    const mouth = 3.4 * facing;
    if (speaking > .25) ellipse(ctx, mouth, 4.5, 1.05, .4 + speaking * .6, "#925f51");
    else limb(ctx, "#975f50", .65, [mouth - 1.55, 4.2], [mouth, 5.45], [mouth + 1.5, 4.1]);
    ctx.restore();
    ctx.restore();
  }

  /* 夏天的一对恋人：一整段慢下来的互动编排（相位 0..1 与诗行同步）
     0.03-0.20 她先挥手、他回应      0.04-0.28 面对面说话（第一节诗）
     0.32-0.50 一起走向树下          0.53-0.80 并肩坐下
     0.57-0.79 她靠在他肩上、他搂着她  0.59-0.69 他指向落日（左侧天空）
     0.64-0.78 她跟着望、指向升起的月亮 0.84-0.92 起身走近
     0.90-0.97 牵手（诗读完前完成）    0.97+    交握的手间升起小心形 */
  function drawSummerPair(ctx, phase, time, breeze, still) {
    const womanWave = during(phase, .030, .115, .022);
    const manWave = during(phase, .095, .195, .022);
    const talk = during(phase, .040, .280, .035);
    const walk = during(phase, .315, .495, .05);
    const path = smooth((phase - .315) / .18);
    const sit = during(phase, .525, .795, .06);
    const leanW = during(phase, .575, .785, .055);
    const hugW = during(phase, .565, .790, .055);
    const lookM = during(phase, .585, .700, .045);
    const pointM = during(phase, .585, .685, .04);
    const lookW = during(phase, .640, .770, .045);
    const pointW = during(phase, .695, .775, .04);
    const close = smooth((phase - .835) / .09);
    const holding = smooth((phase - .895) / .075);
    const manX = mix(188 + 64 * path, 271, close);
    const womanX = mix(285 + 21 * path, 320, close);
    const handX = (manX + womanX) / 2;
    const handY = -62 + (still ? 0 : Math.sin(time * 1.6) * 2.2 * holding);
    const sitTurn = during(phase, .500, .815, .05);   // 坐下时两人都转向左侧看日月
    const walkTurn = during(phase, .325, .485, .05);  // 走路时她转向行进方向
    const stepIn = during(phase, .845, .935, .03);    // 起身走近时的小碎步
    for (const woman of [false, true]) {
      const seed = woman ? 4.7 : 1.3;
      const speak = talk * smooth(.5 + .55 * Math.sin(time * 2.6 + (woman ? 2.2 : 0)));
      drawSummerPerson(ctx, {
        x: woman ? womanX : manX, woman, scale: woman ? 1.19 : 1.25,
        facing: woman ? -1 + 2 * walkTurn : 1 - 2 * sitTurn,
        walk: Math.max(walk, stepIn * .4),
        stride: (woman ? womanX - 285 : manX - 188) * TAU / 48 + (woman ? 1.1 : 0),
        sit, lean: woman ? leanW : leanW * .35,
        greeting: (woman ? womanWave : manWave) * (.85 + .15 * (still ? 1 : Math.sin(time * 8.5 + seed))),
        speaking: speak,
        look: woman ? lookW : lookM,
        point: woman ? pointW : pointM,
        holding, handX, handY,
        reach: woman ? null : [(womanX + 2 - manX) / 1.25, -36],
        reachW: woman ? 0 : hugW,
        gesture: {
          hair: woman ? during(phase, .20, .315, .029) : 0,
          shade: woman ? 0 : during(phase, .49, .575, .025),
          offer: woman ? during(phase, .765, .85, .022) : during(phase, .215, .31, .026),
          nod: during(phase, .05, .29) * Math.sin(time * 3.2 + seed),
          settle: stepIn * .6
        },
        breeze: still ? 0 : breeze, time, seed, still
      });
    }
    // 牵好手之后：交握的手上方轮流升起两枚小心形
    const held = smooth((phase - .965) / .035);
    if (held > 0) {
      for (let i = 0; i < 2; i++) {
        const cyc = still ? .3 + i * .4 : (time * .42 + i * .5) % 1;
        ctx.save();
        ctx.globalAlpha = held * Math.sin(Math.PI * cyc) * .8;
        ctx.fillStyle = i ? "#f78fa8" : "#f4668a";
        drawTinyHeart(ctx, handX + Math.sin(cyc * 6.3 + i * 2.4) * 6,
          GROUND - 76 - cyc * 52, 3.2 + cyc * 2 + i * .7);
        ctx.restore();
      }
    }
  }

  function drawCelestial(ctx, x, y, moon, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const glow = ctx.createRadialGradient(x, y, 10, x, y, 58);
    glow.addColorStop(0, moon ? "#edf4ffb5" : "#ffca778f");
    glow.addColorStop(1, moon ? "#edf4ff00" : "#ffca7700");
    ellipse(ctx, x, y, 58, 58, glow);
    if (moon) {
      ctx.fillStyle = "#ffffdf";
      ctx.beginPath();
      ctx.moveTo(x + 7, y - 23);
      ctx.bezierCurveTo(x - 18, y - 22, x - 29, y + 4, x - 12, y + 18);
      ctx.quadraticCurveTo(x + 1, y + 28, x + 16, y + 14);
      ctx.bezierCurveTo(x - 8, y + 17, x - 11, y - 11, x + 7, y - 23);
      ctx.closePath();
      ctx.fill();
    } else {
      ellipse(ctx, x, y, 23, 23, "#f4b563");
      ellipse(ctx, x - 2, y - 2, 19, 19, "#ffd38d");
    }
    ctx.restore();
  }

  function drawDayCycle(ctx, phase) {
    const sun = smooth((phase - .20) / .15);
    const setting = smooth((phase - .47) / .19);
    const moonrise = smooth((phase - .60) / .13);
    const moonset = smooth((phase - .76) / .17);
    const daylight = during(phase, .20, .68, .08);
    const moonlight = during(phase, .60, .95, .07);
    const sunrise = during(phase, .86, 1.09, .08);
    drawCelestial(ctx, 101 - 51 * setting, 271 - 157 * sun + 136 * setting, false, daylight);
    drawCelestial(ctx, 108 - 55 * moonset, 250 - 124 * moonrise + 151 * moonset, true, moonlight);
    drawCelestial(ctx, 71, 267 - 143 * smooth((phase - .86) / .14), false, sunrise);
    if (moonlight > 0) {
      ctx.save();
      ctx.globalAlpha *= moonlight * .82;
      ellipse(ctx, 128, 107, 1.8, 1.8, "#fffde5");
      ellipse(ctx, 48, 89, 2.5, 2.5, "#fffde5");
      ellipse(ctx, 31, 167, 1.3, 1.3, "#fffde5");
      ctx.restore();
    }
  }

  /* ---------- 树下依偎的一对恋人：左男右女，她的头靠在他胸口，手臂相拥 ---------- */
  function drawCouple(ctx, cx, gy, scale, alpha, elapsed) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, gy);
    ctx.scale(scale, scale);
    ctx.translate(0, -GROUND);
    for (const woman of [false, true]) {
      drawSummerPerson(ctx, {
        x: woman ? 17 : -18, woman, scale: woman ? 1.01 : 1.09,
        clothes: woman ? ["#c67a85", "#a65c6e", "", "#815158"] : ["#885467", "#683f53", "", "#533f4a"],
        facing: woman ? -1 : 1, walk: 0, stride: 0, sit: 0,
        lean: woman ? .81 : .39, greeting: 0, speaking: 0, look: -.15, point: 0,
        holding: 0, handX: 0, handY: -56, reach: woman ? [-19, -48] : [25, -70],
        reachW: 1, eyesClosed: woman, time: elapsed, seed: woman ? 4.7 : 1.3,
        still: elapsed === 0, breeze: Math.sin(elapsed * .83) * .25
      });
    }
    ctx.fillStyle = "#d85b7c";
    drawTinyHeart(ctx, -3, GROUND - 111 + Math.sin(elapsed) * 1.3, 4.5);
    drawTinyHeart(ctx, 8, GROUND - 106 + Math.sin(elapsed - .65), 2.9);
    ctx.restore();
  }

  function drawTinyHeart(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.1, y, x - r * 0.6, y - r, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r, x + r * 1.1, y, x, y + r * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  function drawBreeze(ctx, t) {
    if (t <= 0 || t >= 1) return;
    const x = mix(270, 790, t);
    ctx.strokeStyle = "rgba(255,255,235," + (.48 * Math.sin(Math.PI * t)) + ")";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const start = x - i * 45;
      const y = 280 + i * 70;
      ctx.beginPath();
      ctx.moveTo(start - 138, y + 25);
      ctx.quadraticCurveTo(start - 74, y - 13, start, y);
      ctx.stroke();
    }
  }

  function start({ onProgress, onReady, onSummerProgress, onChapterProgress, summerDuration = 45 } = {}) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas && canvas.getContext("2d");
    if (!ctx) return null;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heart = heartPath();
    const leaf = leafPath();
    const random = randomSource(999);
    const blossoms = makeBlossoms(random);
    const wood = layer(WIDTH, HEIGHT);
    const flowers = layer(WIDTH, HEIGHT);
    const canopy = makeCanopy(leaf, random);
    const chapterCanopies = {};
    const chapterPalettes = {
      fall: ["#885235","#9a6036","#b7763d","#ca8744","#df9a51","#e9b36b","#f5c784"],
      spring: ["#668357","#809c61","#a0ae75","#c0c48d","#e5b0a4","#f0c7be","#ffe5d6"]
    };
    const meadow = makeMeadow(random);
    const petalSources = blossoms.filter(flower => flower.y > 208 && flower.y < 510);
    drawWood(wood, INTRO);
    drawBlossoms(flowers, heart, blossoms, INTRO);

    const origin = performance.now();
    let ready = false;
    let summerStart = null;
    let portrait = false;
    let nextPetal = 3.4;
    let petals = [];
    let summerLeaves = [];
    let nextLeaf = 0;
    let chapter = null;
    let chapterStart = 0;
    let previousFrame = null;
    let finaleStart = null;
    let finaleBurst = [];
    let bloomLayer = null;
    const finaleStars = [];
    for (let i = 0; i < 46; i++) {
      finaleStars.push({ u: random(), v: random(), r: mix(.55, 1.9, random()), ph: random() * TAU });
    }

    function addSummerLeaf(t, gust = false) {
      summerLeaves.push(makeSummerLeaf(t, random, gust));
    }

    function addPetal(time, gust = false) {
      const source = petalSources[Math.floor(random() * petalSources.length)];
      petals.push(makePetal(source, time, random, gust));
    }

    function applyTreeView() {
      if (portrait) ctx.setTransform(.608, 0, 0, .608, -74, 243);
    }

    function applyPeopleView() {
      if (portrait) ctx.setTransform(1.71, 0, 0, 1.71, -228, 735 - GROUND * 1.71);
    }

    function renderChapter(now) {
      const elapsed = reduce ? chapter.duration : Math.max(0, (now - chapterStart) / 1000);
      const motionTime = reduce ? 0 : elapsed;
      const chapters = window.SeasonMotion;
      const change = smooth(elapsed / .94);
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (portrait) ctx.setTransform(.72, 0, 0, .82, -80, 15);
      chapters.sky(ctx, chapter, elapsed, reduce);
      ctx.restore();
      if (portrait) {
        ctx.save();
        ctx.translate(215, 678);
        ctx.scale(251, 117);
        const soil = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
        soil.addColorStop(0, chapter.id === "winter" ? "#d0e0e8c4" : "#a9a87792");
        soil.addColorStop(1, "#84988d00");
        ellipse(ctx, 0, 0, 1, 1, soil);
        ctx.restore();
      }
      applyTreeView();
      chapters.land(ctx, chapter, elapsed, reduce);
      if (!portrait) drawGround(ctx, chapter.id === "spring", .68);
      ctx.drawImage(wood.canvas, 0, 0);
      const needles = chapterCanopies[chapter.id];
      if (needles) {
        const leaves = chapter.id === "fall" ? 1 - .41 * smooth((elapsed - chapter.starts[1]) / 4.3)
          : .20 + .8 * smooth((elapsed - chapter.starts[4]) / (chapter.starts[7] - chapter.starts[4]));
        drawCanopy(ctx, needles, motionTime, leaves, Math.sin(change * Math.PI) * .27, reduce);
      } else {
        ctx.strokeStyle = "#f2f6f3be";
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
        for (const branch of BRANCHES.slice(1)) {
          ctx.beginPath();
          ctx.moveTo(branch[0] + 1, branch[1] - 3);
          ctx.quadraticCurveTo(branch[2] + 1, branch[3] - 3, branch[4], branch[5] - 2);
          ctx.stroke();
        }
      }
      chapters.air(ctx, chapter, elapsed, reduce, leaf, paintHeart);
      applyPeopleView();
      chapters.stage(ctx, chapter, elapsed, GROUND, reduce);
      chapters.drawPair(ctx, chapter, elapsed, wind(motionTime), reduce, drawSummerPerson);
      ctx.resetTransform();

      if (previousFrame && change < 1) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-in";
        ctx.globalAlpha = change;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1 - change;
        ctx.drawImage(previousFrame, 0, 0);
        ctx.restore();
      } else previousFrame = null;

      if (onChapterProgress) onChapterProgress(elapsed, 0);
    }

    /* ---------- 结尾：夜色里回到心形花树，两个人坐在树下看月亮 ---------- */
    function finaleView() {
      return portrait ? { s: .72, x: -132.6, y: 278 } : { s: 1, x: 0, y: 0 };
    }

    function renderFinale(now) {
      const t = reduce ? 60 : Math.max(0, (now - finaleStart) / 1000);
      const view = finaleView();
      const cw = canvas.width;
      const ch = canvas.height;
      const appear = smooth((t - .10) / 1.05);
      const bloom = smooth((t - .26) / 1.65);
      const moonIn = smooth((t - 1.00) / .95);
      const rise = smooth((t - 1.00) / 1.70);
      const pairIn = smooth((t - 1.90) / 1.15);
      const gaze = .18 + .62 * smooth((t - 2.25) / 1.5);
      const moonX = portrait ? 84 : 150;
      const moonY = mix(portrait ? 292 : 190, portrait ? 232 : 128, rise);
      const moonScale = portrait ? 1.1 : 1;
      const canopyX = 480 * view.s + view.x;
      const canopyY = 366 * view.s + view.y;

      ctx.resetTransform();
      ctx.clearRect(0, 0, cw, ch);

      // 星空
      ctx.save();
      for (const star of finaleStars) {
        const twinkle = reduce ? .8 : .34 + .66 * (.5 + .5 * Math.sin(t * 1.15 + star.ph));
        ctx.globalAlpha = twinkle * appear * .85;
        ctx.fillStyle = "#fff6e6";
        ctx.beginPath();
        ctx.arc(star.u * cw, 16 + star.v * (portrait ? 330 : 250), star.r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // 树冠背后的暖光
      ctx.save();
      const halo = ctx.createRadialGradient(canopyX, canopyY, 12, canopyX, canopyY, portrait ? 240 : 340);
      halo.addColorStop(0, "rgba(255,178,196," + (.26 * appear).toFixed(3) + ")");
      halo.addColorStop(.55, "rgba(255,150,180," + (.10 * appear).toFixed(3) + ")");
      halo.addColorStop(1, "rgba(255,150,180,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();

      // 弯月：从树后升起
      if (moonIn > 0) {
        ctx.save();
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 120 * moonScale);
        moonGlow.addColorStop(0, "rgba(255,252,232," + (.46 * moonIn).toFixed(3) + ")");
        moonGlow.addColorStop(.42, "rgba(255,242,208," + (.15 * moonIn).toFixed(3) + ")");
        moonGlow.addColorStop(1, "rgba(255,242,208,0)");
        ctx.fillStyle = moonGlow;
        ctx.fillRect(0, 0, cw, ch);
        ctx.translate(moonX, moonY);
        ctx.scale(moonScale, moonScale);
        drawCelestial(ctx, 0, 0, true, moonIn);
        ctx.restore();
      }

      // 心形花树：从根部向上重新绽开（柔和上推的蒙版，不要硬边）
      ctx.save();
      ctx.setTransform(view.s, 0, 0, view.s, view.x, view.y);
      drawGround(ctx, false, .9 * appear);
      if (bloom >= 1) {
        ctx.globalAlpha = appear;
        ctx.drawImage(wood.canvas, 0, 0);
        ctx.drawImage(flowers.canvas, 0, 0);
      } else {
        const paint = bloomLayer || (bloomLayer = layer(WIDTH, HEIGHT));
        paint.globalCompositeOperation = "source-over";
        paint.globalAlpha = 1;
        paint.clearRect(0, 0, WIDTH, HEIGHT);
        paint.drawImage(wood.canvas, 0, 0);
        paint.drawImage(flowers.canvas, 0, 0);
        const edge = mix(GROUND + 60, -110, bloom);
        const mask = paint.createLinearGradient(0, edge - 170, 0, edge + 30);
        mask.addColorStop(0, "rgba(255,255,255,0)");
        mask.addColorStop(1, "rgba(255,255,255,1)");
        paint.globalCompositeOperation = "destination-in";
        paint.fillStyle = mask;
        paint.fillRect(0, 0, WIDTH, HEIGHT);
        paint.globalCompositeOperation = "source-over";
        ctx.globalAlpha = appear;
        ctx.drawImage(paint.canvas, 0, 0);
      }
      ctx.restore();

      // 花树炸开的一瞬：心形花瓣朝四周飘散
      if (!reduce && t < 2.3) {
        ctx.save();
        ctx.setTransform(view.s, 0, 0, view.s, view.x, view.y);
        for (const b of finaleBurst) {
          const k = unit((t - .34 - b.delay) / 1.5);
          if (k <= 0 || k >= 1) continue;
          const ease = 1 - Math.pow(1 - k, 2.4);
          const dist = b.dist * ease;
          ctx.globalAlpha = (1 - k) * (1 - k) * .9;
          paintHeart(ctx, heart, 480 + Math.cos(b.a) * dist,
            348 + Math.sin(b.a) * dist * .82 - ease * 66,
            b.size * (1 - .35 * k), b.spin + k * 2.6, b.color, .9);
        }
        ctx.restore();
      }

      // 坐在树下抬头看月亮的两个人
      if (pairIn > 0) {
        ctx.save();
        ctx.setTransform(view.s, 0, 0, view.s, view.x, view.y);
        ctx.globalAlpha = pairIn;
        const manX = portrait ? 330 : 292;
        const womanX = portrait ? 376 : 338;
        for (const woman of [false, true]) {
          const seed = woman ? 4.7 : 1.3;
          drawSummerPerson(ctx, {
            x: woman ? womanX : manX, woman, scale: woman ? 1.3 : 1.36,
            facing: -1, walk: 0, stride: 0, sit: 1,
            lean: woman ? .62 : .2,
            greeting: 0, speaking: 0,
            look: woman ? gaze * .98 : gaze,
            point: 0, holding: 0, handX: (manX + womanX) / 2, handY: -56,
            reach: woman ? null : [(womanX + 3 - manX) / 1.36, -34],
            reachW: woman ? 0 : 1,
            eyesClosed: false,
            gesture: { hair: 0, collar: 0, shade: 0, offer: 0, heart: 0, nod: 0, settle: 0 },
            breeze: reduce ? 0 : wind(t) * .5,
            time: t, seed, still: false,
            clothes: woman
              ? ["#c67a85", "#a65c6e", "", "#815158"]
              : ["#885467", "#683f53", "", "#533f4a"]
          });
        }
        ctx.restore();
      }

      // 慢慢升起的心形
      if (!reduce) {
        ctx.save();
        ctx.setTransform(view.s, 0, 0, view.s, view.x, view.y);
        for (let i = 0; i < 8; i++) {
          const cyc = ((t * .1) + i * .125) % 1;
          const x = 312 + Math.sin(t * .45 + i * 1.7) * 46 + (i % 4) * 24;
          const y = GROUND - 76 - cyc * 300;
          ctx.globalAlpha = Math.sin(Math.PI * cyc) * .42 * appear;
          paintHeart(ctx, heart, x, y, 2.6 + (i % 3) * 1.1, cyc * 1.8 + i, ROSE[(i * 2 + 1) % ROSE.length], .8);
        }
        ctx.restore();
      }

      // 旧画面淡出
      if (previousFrame && t < 1.3) {
        ctx.save();
        ctx.globalAlpha = 1 - smooth(t / .74);
        ctx.drawImage(previousFrame, 0, 0);
        ctx.restore();
        if (t > .82) previousFrame = null;
      }

      // 转场的光由 CSS 的 .finale-flash 承担，画布内不再铺一层（否则会露出画布矩形边）
    }

    function render(now) {
      if (finaleStart !== null) {
        renderFinale(now);
        if (!reduce) window.requestAnimationFrame(render);
        return;
      }
      if (chapter) {
        renderChapter(now);
        if (!reduce) window.requestAnimationFrame(render);
        return;
      }
      const time = reduce ? INTRO : Math.max(0, (now - origin) / 1000);
      const inSummer = summerStart !== null;
      const summerTime = inSummer ? Math.max(0, (now - summerStart) / 1000) : 0;
      const storyTime = reduce && inSummer ? summerDuration : summerTime;
      const phase = unit(storyTime / summerDuration);
      const twilight = .85 * during(phase, .46, .98, .20);
      const turn = inSummer ? (reduce ? 1 : unit(summerTime / CROSSFADE)) : 0;
      const season = smooth(turn);
      const gust = Math.sin(turn * Math.PI);
      const coupleAlpha = smooth((time - 3.52) / .87);

      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (season > 0) {
        ctx.save();
        ctx.globalAlpha = season;
        if (portrait) ctx.setTransform(1.32, 0, 0, 1.23, -20, -38);
        drawDayCycle(ctx, phase);
        ctx.restore();
        if (portrait) {
          ctx.save();
          ctx.globalAlpha = season;
          ctx.translate(215, 678);
          ctx.scale(251, 117);
          const lawn = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
          lawn.addColorStop(0, "#74985d65");
          lawn.addColorStop(.52, "#89a96b38");
          lawn.addColorStop(1, "#89a96b00");
          ellipse(ctx, 0, 0, 1, 1, lawn);
          ctx.restore();
        }
      }
      if (portrait) ctx.setTransform(.608, 0, 0, .608, -74, 243);
      drawGround(ctx, false, smooth((time - .78) / 1.05) * (1 - season));
      if (season > 0) {
        if (!portrait) drawGround(ctx, true, season);
        ctx.save();
        ctx.globalAlpha = season;
        drawMeadow(ctx, meadow, reduce ? 0 : summerTime, gust);
        ctx.restore();
      }

      if (time >= 2.65) ctx.drawImage(wood.canvas, 0, 0);
      else drawWood(ctx, time);
      drawSeed(ctx, heart, time);

      if (season < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - season;
        if (time >= 4.22) ctx.drawImage(flowers.canvas, 0, 0);
        else drawBlossoms(ctx, heart, blossoms, time);
        ctx.restore();
        if (!inSummer && !reduce && time >= nextPetal) {
          addPetal(time);
          nextPetal = time + mix(.38, .89, random());
        }
        petals = petals.filter(petal => time < petal.start + petal.duration + 1.15);
        for (const petal of petals) drawPetal(ctx, heart, petal, time, gust > 0 ? season * .75 : season);
        drawCouple(ctx, 243, GROUND, 1.18, coupleAlpha * (1 - season), reduce ? 0 : time);
      }

      if (season > 0) {
        drawCanopy(ctx, canopy, summerTime, season, gust, reduce);
        if (!reduce && summerTime >= nextLeaf) {
          addSummerLeaf(summerTime, gust > .5);
          nextLeaf = summerTime + mix(.45, 1.05, random());
        }
        summerLeaves = summerLeaves.filter(l => summerTime < l.start + l.duration + 1.15);
        for (const l of summerLeaves) drawPetal(ctx, heart, l, summerTime, season);
        ctx.save();
        ctx.globalAlpha = season;
        const motionTime = reduce ? 0 : summerTime;
        drawSummerAir(ctx, leaf, motionTime, gust, reduce);
        if (portrait) ctx.setTransform(1.71, 0, 0, 1.71, -228, 735 - GROUND * 1.71);
        drawSummerPair(ctx, phase, motionTime, wind(motionTime) + gust, reduce);
        ctx.restore();
        drawBreeze(ctx, turn);
      }

      if (inSummer && onSummerProgress) onSummerProgress(storyTime, twilight);
      if (!ready) {
        if (onProgress) onProgress(unit(time / INTRO));
        if (time >= INTRO) {
          ready = true;
          if (onReady) onReady();
        }
      }
      if (!reduce) window.requestAnimationFrame(render);
    }

    if (reduce) render(origin);
    else window.requestAnimationFrame(render);

    return {
      setPortrait: function (enabled) {
        if (portrait === enabled) return;
        portrait = enabled;
        previousFrame = null;
        canvas.width = enabled ? PORTRAIT_WIDTH : WIDTH;
        canvas.height = enabled ? PORTRAIT_HEIGHT : HEIGHT;
        if (reduce) render(performance.now());
      },
      enterChapter: function (data) {
        const now = performance.now();
        if (!reduce) {
          const snapshot = layer(canvas.width, canvas.height);
          snapshot.drawImage(canvas, 0, 0);
          previousFrame = snapshot.canvas;
        }
        chapter = window.SeasonMotion.create(data);
        chapterStart = now;
        if (chapterPalettes[chapter.id] && !chapterCanopies[chapter.id]) {
          chapterCanopies[chapter.id] = makeCanopy(leaf, random, chapterPalettes[chapter.id], chapter.id === "fall" ? 115 : 85);
        }
        if (reduce) render(now);
      },
      enterFinale: function () {
        if (finaleStart !== null) return false;
        const now = performance.now();
        if (!reduce) {
          const snapshot = layer(canvas.width, canvas.height);
          snapshot.drawImage(canvas, 0, 0);
          previousFrame = snapshot.canvas;
        }
        finaleBurst = [];
        for (let i = 0; i < 30; i++) {
          finaleBurst.push({
            a: random() * TAU,
            dist: mix(60, 290, Math.pow(random(), .75)),
            size: mix(3.6, 9, random()),
            spin: random() * TAU,
            color: ROSE[Math.floor(random() * ROSE.length)],
            delay: random() * .45
          });
        }
        chapter = null;
        finaleStart = now;
        if (reduce) render(now);
        return true;
      },
      enterSummer: function () {
        if (!ready || summerStart !== null) return false;
        summerStart = performance.now();
        if (reduce) {
          for (let i = 0; i < 12; i++) {
            const l = makeSummerLeaf(0, random, false);
            l.start = -mix(.4, l.duration * .8, random());
            summerLeaves.push(l);
          }
          render(summerStart);
        } else {
          const time = (summerStart - origin) / 1000;
          for (let i = 0; i < 9; i++) addPetal(time, true);
          for (let i = 0; i < 7; i++) {
            const l = makeSummerLeaf(0, random, false);
            l.start = -mix(.2, 2.6, random());
            summerLeaves.push(l);
          }
          nextLeaf = 0;
        }
        return true;
      }
    };
  }

  window.LoveLetter = { start };
})(window);

