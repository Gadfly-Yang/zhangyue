(function (window) {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const arc = (t, start, end, fade = .75) => ease((t - start) / fade) * ease((end - t) / fade);
  const SUMMER_END = { man: 271, woman: 320, hold: 1 };
  const FALL_END = { man: 263, woman: 309, hold: 1, lean: .22 };
  const WINTER_END = { man: 269, woman: 309, hold: 1, lean: .43 };
  const BASE_POSE = {
    man: 271, woman: 320, hold: 0, lean: 0, walkM: 0, walkW: 0,
    lookM: 0, lookW: 0, sit: 0, talk: 0, wave: 0, run: 0, facingM: 1,
    facingW: -1, reach: 0, warm: 0, kiss: 0, phone: 0, strideM: 0, strideW: 1.5
  };
  const CLOTHES = {
    fall: [["#65766b","#4e6053","","#424f48"],["#be7454","#92513b","","#684836"]],
    winter: [["#536a76","#394f58","#ab6247","#3f4d54"],["#a76b60","#854c42","#e1be85","#685359"]],
    spring: [["#748b70","#536f59","","#495b54"],["#cb8b91","#a8616f","","#805767"]]
  };
  const EDITS = {
    fall: [
      [1, 1.7, { man: 221, woman: 325, hold: 0, walkM: .38, walkW: .22, facingM: -.7, lookM: .6, lookW: .65 }],
      [3, 1.1, { walkM: 0, walkW: 0, facingM: 1, lookM: .15, lookW: .2 }],
      [4, 1.7, { man: 243, woman: 311, walkM: .32, walkW: .25, talk: .8 }],
      [5, 1.25, { sit: .8, reach: .68, walkM: 0, walkW: 0, lookM: -.7, lookW: -.7 }],
      [7, 1.35, { sit: .45, reach: .22, lookM: -.15, lookW: -.1 }],
      [8, 1.7, { man: 180, woman: 335, sit: 0, reach: 0, walkM: .62, walkW: .3, talk: 0 }],
      [10, .7, { walkM: 0, walkW: 0, wave: .62, lookW: .4 }],
      [11, 1.45, { man: 275, woman: 322, walkM: 1, run: 1, walkW: .35, wave: .15 }],
      [12, .9, { walkM: 0, run: 0, walkW: 0, talk: 1, wave: 0, lookW: 0, reach: .24 }],
      [13, .85, { hold: 1, reach: 0, lean: .17, talk: .28 }],
      [14, 1.5, { man: 295, woman: 342, walkM: .43, walkW: .42, facingW: .88, talk: .59 }],
      [15, 1.4, { man: 305, woman: 351, walkM: .26, walkW: .25 }],
      [16, 1.65, { man: 227, woman: 350, hold: 0, walkM: .57, walkW: .28, talk: 0, lean: 0, facingM: -.8 }],
      [17, 1.25, { walkM: 0, walkW: 0, lookM: .24, lookW: .20 }],
      [19, 1.4, { man: 263, woman: 309, facingM: 1, facingW: -1, walkM: .42, walkW: .36, reach: .35, hold: .48 }],
      [20, 1.05, { ...FALL_END, walkM: 0, walkW: 0, reach: 0, lookM: 0, lookW: 0 }]
    ],
    winter: [
      [0, 1.1, { hold: .22, warm: .35, walkM: .2, walkW: .2 }],
      [3, 1.1, { man: 230, woman: 286, warm: .05, walkM: .56, walkW: .53, facingW: .95, lean: .12, hold: .68 }],
      [5, 1.2, { man: 249, woman: 292, hold: 1, lean: .35, talk: .28 }],
      [7, 1.45, { man: 285, woman: 327, walkM: .5, walkW: .47, talk: .72 }],
      [9, .75, { walkM: 0, walkW: 0, facingW: -1, man: 277, woman: 321, reach: .43, hold: .80, talk: .4 }],
      [10, 1, { man: 276, woman: 320, kiss: 1, lean: .55, talk: 0, reach: 0, hold: 1 }],
      [11, 1.35, { man: 274, woman: 321, kiss: 0, lean: .45, warm: .28, talk: .3 }],
      [12, 1.3, { man: 206, woman: 339, lean: .03, hold: 0, phone: 1, warm: 0, lookM: -.68, lookW: -.61, talk: .17 }],
      [14, 1.45, { man: 245, woman: 305, phone: 0, walkM: .51, walkW: .45, hold: .3, facingW: .85, lookM: 0, lookW: 0 }],
      [15, 1.45, { man: 263, woman: 310, hold: 1, walkM: .32, walkW: .3, lean: .22 }],
      [16, 1.15, { man: 266, woman: 310, facingW: -1, lean: .54, kiss: .82, walkM: .05, walkW: .05 }],
      [17, 1.3, { ...WINTER_END, kiss: 0, walkM: 0, walkW: 0, talk: 0 }]
    ],
    spring: [
      [1, 1.45, { man: 234, woman: 326, hold: .18, lean: .08, lookM: .35, walkM: .37, walkW: .25 }],
      [2, 1.3, { man: 214, woman: 347, sit: .40, lookM: -.63, lookW: -.25, walkM: 0, walkW: 0, hold: 0 }],
      [4, 1.25, { sit: 0, man: 236, woman: 338, lookM: .43, lookW: .55, walkM: .26 }],
      [6, 1.05, { walkM: 0, wave: .36, lookM: .25, lookW: .2 }],
      [7, 1.1, { wave: .55, lookM: .84, lookW: .82 }],
      [9, 1.15, { lookM: 0, lookW: 0, wave: 0, talk: .25 }],
      [11, 1.35, { man: 178, woman: 355, talk: 0, walkM: .22, walkW: .22, facingM: 1, facingW: -1 }],
      [13, 1.55, { man: 258, woman: 319, walkM: .88, walkW: .66, wave: .40 }],
      [14, .95, { man: 264, woman: 311, walkM: 0, walkW: 0, wave: 0, talk: .53, lean: .14 }],
      [15, 1.1, { hold: .71, warm: .85, talk: .24, lookM: -.43, lookW: -.45 }],
      [16, 1.0, { hold: 1, warm: .44, lean: .36, talk: .12, lookM: -.10, lookW: -.08 }],
      [17, 1.45, { man: 265, woman: 311, hold: 1, warm: .82, lean: .49, lookM: -.12, lookW: .08, talk: .12 }]
    ]
  };

  function create(chapter) {
    const initial = { ...BASE_POSE, ...({ fall: SUMMER_END, winter: FALL_END, spring: WINTER_END }[chapter.id]) };
    // Several gestures can share a verse. Fractions place them between line reveals.
    const cueLines = {
      fall: [0, 1, 1.4, 1.75, 2, 2.6, 3, 3.5, 4, 5, 6, 6.6, 7, 7.5, 8, 9, 10, 10.6, 11, 12, 13],
      winter: [0, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 8.55, 9, 10, 11, 12, 12.65, 13],
      spring: [0, 1, 2, 2.5, 3, 4, 5, 5.5, 6, 6.5, 7, 8, 9, 9.6, 10, 11, 12, 13]
    };
    const cues = cueLines[chapter.id].map(line => {
      const index = Math.floor(line);
      return mix(chapter.starts[index], chapter.starts[index + 1] ?? chapter.duration, line - index);
    });
    const stops = [[0, initial]];
    let previous = initial;
    EDITS[chapter.id].forEach(([line, seconds, change]) => {
      const start = cues[line];
      const end = Math.min(start + seconds, cues[line + 1] || chapter.duration);
      const target = { ...previous, ...change };
      target.strideM = previous.strideM + (target.man - previous.man) * TAU / (change.run ? 58 : 46);
      target.strideW = previous.strideW + (target.woman - previous.woman) * TAU / 43;
      stops.push([start, previous], [end, target]);
      previous = target;
    });
    return { ...chapter, stops, cues };
  }

  function poseAt(chapter, time) {
    for (let index = 1; index < chapter.stops.length; index++) {
      const [end, next] = chapter.stops[index];
      if (time >= end) continue;
      const [start, previous] = chapter.stops[index - 1];
      const t = ease((time - start) / (end - start));
      if (previous === next) return previous;
      const result = {};
      for (const key of Object.keys(previous)) result[key] = mix(previous[key], next[key], t);
      return result;
    }
    return chapter.stops[chapter.stops.length - 1][1];
  }

  function drawPair(ctx, chapter, elapsed, breeze, still, drawPerson) {
    const pose = poseAt(chapter, elapsed);
    const before = poseAt(chapter, Math.max(0, elapsed - .12));
    const after = poseAt(chapter, elapsed + .12);
    const time = still ? 0 : elapsed;
    for (const woman of [false, true]) {
      const x = woman ? pose.woman : pose.man;
      const otherX = woman ? pose.man : pose.woman;
      const direction = woman ? -1 : 1;
      const scale = woman ? 1.19 : 1.25;
      // Shape the free hand independently of the hand that meets the partner.
      const cue = (line, duration, delay = 0) => {
        const start = chapter.cues[line] + delay;
        return arc(elapsed, start, start + duration, Math.min(.58, duration / 3));
      };
      const autumn = chapter.id === "fall", winter = chapter.id === "winter";
      const catchLeaf = autumn && woman ? cue(1, 2.4, .15) : 0;
      const gesture = {
        offer: Math.max(catchLeaf, autumn ? cue(5, 2.15, woman ? .35 : 0)
          : winter ? cue(11, 1.4, woman ? .22 : 0) : cue(3, 2, woman ? .38 : .05)),
        leaf: catchLeaf,
        shade: autumn ? (woman ? cue(10, 1.8) : cue(17, 1.8)) : !winter && !woman ? cue(7, 2.3) : 0,
        collar: winter ? Math.max(cue(3, 1.8, woman ? .33 : 0), cue(11, 1.65, woman ? 0 : .55)) : 0,
        hair: woman && !winter ? (autumn ? cue(12, 1.65) : cue(12, 2.05)) : 0,
        heart: winter ? cue(13, 1.75, woman ? .1 : .52) : !autumn ? cue(14, 1.72, woman ? .44 : 0) : 0,
        nod: !still ? (pose.talk * Math.sin(time * 3.1 + (woman ? 1.8 : 0))) : 0,
        settle: pose.run * .55 + pose.warm * .35
      };
      const reachWeight = Math.max(pose.reach, pose.phone);
      const reach = pose.phone > 0
        ? [direction * 21, -73]
        : [direction * 23, pose.sit > .3 ? -15 : -49];
      drawPerson(ctx, {
        x, woman, scale, clothes: CLOTHES[chapter.id][woman ? 1 : 0],
        facing: woman ? pose.facingW : pose.facingM,
        walk: still ? 0 : (woman ? pose.walkW * clamp(Math.abs(after.woman - before.woman) / 7)
          : pose.walkM * clamp(Math.abs(after.man - before.man) / 7)),
        stride: woman ? pose.strideW : pose.strideM,
        run: woman ? 0 : pose.run, sit: pose.sit, lean: pose.lean,
        greeting: pose.wave * (woman ? .64 : .09),
        speaking: pose.talk * (.55 + .42 * Math.sin(time * 3 + (woman ? Math.PI : 0))),
        look: woman ? pose.lookW : pose.lookM, point: 0, holding: pose.hold,
        handX: (x + otherX) / 2, handY: -59 - pose.warm * 21,
        reach, reachW: reachWeight, eyesClosed: pose.kiss > .72, phone: pose.phone,
        gesture, breeze, time, seed: woman ? 4.7 : 1.3, still
      });
    }
  }

  function oval(ctx, x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  function birds(ctx, time, opacity, incoming) {
    ctx.save();
    ctx.globalAlpha *= opacity;
    const x = mix(incoming ? 635 : 200, incoming ? 220 : 720, time);
    ctx.strokeStyle = "#535a5c";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.25;
    for (let i = 0; i < 7; i++) {
      const bx = x + (incoming ? 1 : -1) * i * 20;
      const y = 116 - 45 * time + Math.abs(3 - i) * 7;
      const wing = 7 + 5 * Math.sin(time * 40 + i);
      ctx.beginPath();
      ctx.moveTo(bx - 10, y - wing);
      ctx.quadraticCurveTo(bx - 6, y - wing * .8, bx, y);
      ctx.quadraticCurveTo(bx + 5, y - wing * .85, bx + 10, y - wing);
      ctx.stroke();
    }
    ctx.restore();
  }

  function sky(ctx, chapter, elapsed, still) {
    const at = chapter.cues;
    const t = still ? 0 : elapsed;
    if (chapter.id === "fall") {
      const cloud = arc(elapsed, at[8] - .8, at[14], 1.8);
      ctx.save();
      ctx.globalAlpha *= cloud;
      ctx.translate(216 + 13 * Math.sin(t * .35), 145);
      ctx.scale(228, 52);
      const mist = ctx.createRadialGradient(0, 0, .1, 0, 0, 1);
      mist.addColorStop(0, "#91999bb2");
      mist.addColorStop(.44, "#91999b74");
      mist.addColorStop(1, "#91999b00");
      oval(ctx, 0, 0, 1, 1, mist);
      ctx.restore();
      const migration = clamp((elapsed - at[2]) / 4.6);
      birds(ctx, migration, arc(elapsed, at[2], at[2] + 4.6, .7) * .8, false);
    }
    if (chapter.id === "spring") {
      const arrival = clamp((elapsed - at[7]) / 5.8);
      birds(ctx, arrival, arc(elapsed, at[7], at[7] + 5.8, .85) * .69, true);
    }
  }

  function land(ctx, chapter, elapsed, still) {
    const id = chapter.id;
    const t = still ? 0 : elapsed;
    ctx.save();
    ctx.translate(448, 563);
    ctx.scale(513, 83);
    const water = ctx.createRadialGradient(0, -.12, .04, 0, 0, 1);
    water.addColorStop(0, id === "winter" ? "#a0b8c6be" : id === "spring" ? "#a8c3b0b9" : "#c5a56fce");
    water.addColorStop(.58, id === "winter" ? "#baccd2a0" : id === "spring" ? "#ced4b299" : "#d6b979a0");
    water.addColorStop(1, "#e1dbbc00");
    oval(ctx, 0, 0, 1, 1, water);
    ctx.restore();
    const shine = id === "fall" ? ease((elapsed - chapter.cues[16]) / 2.1)
      : id === "winter" ? ease((elapsed - chapter.cues[14]) / 2.5) * .58 : .42;
    for (let i = 0; i < 18; i++) {
      const wave = .5 + .5 * Math.sin(i * 1.48 + t * .86);
      const x = 155 + (i * 71) % 625 + wave * 9;
      const y = 519 + (i * 14) % 70;
      ctx.fillStyle = i % 4 ? "rgba(255,253,227," + (.18 + shine * wave * .44) + ")" : "#eaf0e99c";
      ctx.fillRect(x, y, 18 + wave * (46 + shine * 52), 1 + wave * 2);
    }
    if (id === "winter") {
      for (const [x, height] of [[117,137],[146,103],[168,124],[771,159],[815,115]]) {
        ctx.fillStyle = "#a06f5a62";
        ctx.beginPath();
        ctx.moveTo(x, 544 - height);
        ctx.lineTo(x + 16, 543);
        ctx.lineTo(x - 14, 543);
        ctx.fill();
        ctx.fillStyle = "#8c6a608e";
        ctx.fillRect(x - 1, 538, 2, 20);
      }
    }
  }

  function stage(ctx, chapter, elapsed, ground, still) {
    const pose = poseAt(chapter, elapsed);
    if (chapter.id === "spring") {
      const visible = ease((elapsed - chapter.cues[11] + .55) / 2.25);
      ctx.save();
      ctx.globalAlpha *= visible;
      ctx.strokeStyle = "#aa8274";
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      for (const x of [148, 177, 212, 250, 283, 317, 348, 377]) {
        ctx.beginPath();
        ctx.moveTo(x, ground - 8);
        ctx.lineTo(x, ground + 9);
        ctx.stroke();
      }
      ctx.strokeStyle = "#c3a292";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(143, ground - 8);
      ctx.quadraticCurveTo(267, ground - 23, 382, ground - 8);
      ctx.stroke();
      ctx.strokeStyle = "#aa7b6b";
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(143, ground + 10);
      ctx.quadraticCurveTo(267, ground - 7, 382, ground + 10);
      ctx.stroke();
      ctx.restore();
    }
    if (chapter.id === "fall") {
      ctx.save();
      ctx.globalAlpha *= arc(elapsed, chapter.cues[5], chapter.cues[8], 1);
      const growth = ease((elapsed - chapter.cues[6]) / 2);
      const center = (pose.man + pose.woman) / 2;
      oval(ctx, center, ground + 2, 12, 2.7, "#7f6944");
      for (const direction of [-1, 1]) {
        oval(ctx, center + 4 * direction, ground - growth * 6, 2.2 + growth * 2, 1.5, "#71814e");
      }
      ctx.restore();
    }
    if (chapter.id === "winter") {
      const sunset = ease((elapsed - chapter.cues[14]) / 3.8);
      ctx.save();
      ctx.globalAlpha *= sunset * .28;
      for (const x of [pose.man, pose.woman]) {
        ctx.translate(x, ground + 2);
        ctx.transform(1, -.13, .9, .32, 0, 0);
        oval(ctx, -27 * sunset, 9, 30 * sunset + 2, 5.4, "#66778b");
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= sunset * .28;
      }
      ctx.restore();
      if (!still && elapsed < chapter.cues[6]) {
        const t = (elapsed * .65) % 1;
        ctx.save();
        ctx.globalAlpha *= Math.sin(Math.PI * t) * .6;
        oval(ctx, pose.man + 10 + t * 15, ground - 91 - t * 7, 3 + t * 5, 2 + t * 2.2, "#fffffc");
        ctx.restore();
      }
    }
  }

  function air(ctx, chapter, elapsed, still, leaf, paintLeaf) {
    const winter = chapter.id === "winter";
    const spring = chapter.id === "spring";
    if (spring) {
      const willow = ease((elapsed - chapter.cues[12]) / 2.1);
      ctx.save();
      ctx.globalAlpha *= willow * .86;
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = "#788e61";
      for (let i = 0; i < 9; i++) {
        const x = 557 + i * 22;
        const y = 301 + (i * 23) % 24;
        const length = 42 + (i * 31) % 47;
        const drift = still ? 0 : Math.sin(elapsed * 1.32 + i * .38) * 7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - 10 + drift * .2, y + length * .52, x + drift, y + length);
        ctx.stroke();
        for (let bud = 1; bud < 5; bud++) {
          const fraction = bud * .18;
          const side = bud % 2 ? -1 : 1;
          paintLeaf(ctx, leaf, x + (side * 2 - 3 + drift * fraction) * fraction,
            y + length * fraction, 3.2, side * .83, bud % 2 ? "#c7c48a" : "#a3b071");
        }
      }
      ctx.restore();
    }
    const amount = winter ? 34 : 25;
    const fallColors = ["#a95832", "#ba6a39", "#d29150", "#e3ab60"];
    for (let i = 0; i < amount; i++) {
      const offset = (i * .4311) % 1;
      const t = still ? offset : (offset + elapsed * (.105 + i % 5 * .016)) % 1;
      const x = 104 + i * 101 % 665 + Math.sin(i * 4 + t * 5.1) * 39 + t * (winter ? 105 : 66);
      const y = (winter ? 28 : 179) + (i * 26) % 188 + t * (winter ? 396 : 305);
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * t) * (winter ? .79 : .88);
      if (winter) oval(ctx, x, y, 1.2 + i % 3 * .7, 1.4 + i % 4 * .53, "#fffefd");
      else paintLeaf(ctx, leaf, x, y, 3.5 + i % 6, i * 7 + t * 6,
        spring ? (i % 3 ? "#f0b2ae" : "#ebccc1") : fallColors[i % fallColors.length],
        .42 + .4 * Math.abs(Math.sin(i + t * 7)));
      ctx.restore();
    }
  }

  window.SeasonMotion = { create, drawPair, sky, land, stage, air, ease };
})(window);
