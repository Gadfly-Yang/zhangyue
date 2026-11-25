// Voice control (Web Speech API), spoken part descriptions, session recording (MediaRecorder) and the
// command parser that turns a sentence into app actions. Kept free of app state so it is easy to test.

/** Spoken nicknames -> catalog names. */
export const ALIASES = {
  heart: 'Human Heart', brain: 'Human Brain', kidney: 'Kidney', kidneys: 'Kidney', lung: 'Lungs', lungs: 'Lungs',
  eye: 'Human Eye', eyes: 'Human Eye', ear: 'Human Ear', ears: 'Human Ear', tooth: 'Tooth (Molar)', teeth: 'Tooth (Molar)', molar: 'Tooth (Molar)',
  skull: 'Skull', skeleton: 'Skeleton', bones: 'Skeleton', body: 'Human Body', human: 'Human Body', dna: 'DNA Double Helix', helix: 'DNA Double Helix',
  cell: 'Animal Cell', car: 'Sports Car', motorcycle: 'Motorcycle', motorbike: 'Motorcycle', bike: 'Motorcycle', plane: 'Airliner',
  airplane: 'Airliner', aeroplane: 'Airliner', airliner: 'Airliner', jet: 'Turbofan Jet Engine', turbofan: 'Turbofan Jet Engine', rocket: 'Saturn V Rocket',
  saturn: 'Saturn V Rocket', watch: 'Mechanical Watch', battery: 'EV Battery Pack', v8: 'Supercharged HEMI V8', hemi: 'Supercharged HEMI V8',
  engine: 'Inline-4 Engine', radial: 'Radial Aircraft Engine', eiffel: 'Eiffel Tower', pyramid: 'Great Pyramid', colosseum: 'Colosseum',
  pisa: 'Leaning Tower of Pisa', taj: 'Taj Mahal', ben: 'Big Ben', liberty: 'Statue of Liberty', burj: 'Burj Khalifa', christ: 'Christ the Redeemer',
  redeemer: 'Christ the Redeemer', opera: 'Sydney Opera House', turtle: 'Turtle Tower',
};
const STOP = new Set(['the', 'and', 'of', 'lobe', 'lobes', 'part', 'parts', 'show', 'me', 'with', 'what', 'this', 'that']);
const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);

/**
 * Parse a spoken sentence. catalog: [{name}], labels: labels of the current model ([{label}]).
 * zh (optional): { aliases, modelName, labelName } adds Chinese commands and names.
 * Returns a list of actions: {type: 'model', name} | {type: 'part', index} | {type: 'explode'|'assemble'|'next'|'prev'|
 * 'snap'|'dissolve'|'quiz'|'stopQuiz'|'cut'|'zoomIn'|'zoomOut'|'rotate'|'describe'|'record'}.
 */
export function parseCommand(text, catalog, labels = [], zh = null) {
  const t = ` ${words(text).join(' ')} `, has = (...ws) => ws.some((w) => t.includes(` ${w} `));
  const raw = String(text || '');
  const cn = (...re) => !!zh && re.some((r) => r.test(raw));
  const acts = [];
  const add = (a) => { if (!acts.some((x) => x.type === a.type)) acts.push(a); };
  if (cn(/停止测验|结束测验|退出测验/) || has('stop quiz', 'end quiz', 'quit quiz')) return [{ type: 'stopQuiz' }];
  if (cn(/测验|测试|考考我/) || has('quiz', 'test me')) return [{ type: 'quiz' }];
  if (cn(/这是什么|什么部件|介绍一下|讲解|说说|介绍/) || has('what is this', 'what is that', 'tell me', 'explain', 'describe', 'what does it do')) add({ type: 'describe' });
  // a part of the current model ("show me the hippocampus" / "给我看看海马体")
  let bestPart = -1, bestLen = 0;                          // score = total length of the label's words that were said
  labels.forEach((L, i) => {
    let score = 0;
    for (const w of new Set(words(L.label))) if (w.length >= 4 && !STOP.has(w) && t.includes(` ${w} `)) score += w.length;
    if (zh) { const nm = zh.labelName ? zh.labelName(L) : L.label; if (nm && raw.includes(nm) && nm.length > score) score = nm.length; }
    if (score > bestLen) { bestLen = score; bestPart = i; }
  });
  // a model: full name first, then a nickname
  let model = catalog.find((d) => t.includes(` ${words(d.name).join(' ')} `))?.name;
  if (zh && !model) for (const d of catalog) { const nm = zh.modelName ? zh.modelName(d) : d.name; if (nm && raw.includes(nm)) { model = d.name; break; } }
  if (!model) {
    const src = zh ? { ...ALIASES, ...(zh.aliases || {}) } : ALIASES;
    for (const [k, v] of Object.entries(src).sort((a, b) => b[0].length - a[0].length)) if ((zh ? raw : t).includes(zh ? k : ` ${k} `)) { model = v; break; }
  }
  if (bestPart >= 0 && (!model || bestLen >= (zh && !t.trim() ? 2 : 5))) add({ type: 'part', index: bestPart });
  else if (model) add({ type: 'model', name: model });
  if (cn(/拆开|展开|打开|分解|内部|爆开/) || has('explode', 'open', 'apart', 'inside', 'expand', 'break')) add({ type: 'explode' });
  else if (cn(/合拢|合上|拼合|组装|收起来/) || has('assemble', 'close', 'together', 'contract', 'collapse', 'build')) add({ type: 'assemble' });
  if (cn(/下一个|下一件|换一个/) || has('next')) add({ type: 'next' });
  if (cn(/上一个|上一件|前一个/) || has('previous', 'go back', 'last one')) add({ type: 'prev' });
  if (cn(/召唤|开始|醒来/) || has('snap', 'summon', 'start')) add({ type: 'snap' });
  if (cn(/消散|消失|清空|散开/) || has('dissolve', 'clear', 'vanish')) add({ type: 'dissolve' });
  if (cn(/剖面|切开|切片/) || has('cut', 'slice', 'section')) add({ type: 'cut' });
  if (cn(/放大|拉近|靠近/) || has('zoom in', 'bigger', 'closer')) add({ type: 'zoomIn' });
  if (cn(/缩小|拉远|远离/) || has('zoom out', 'smaller', 'further')) add({ type: 'zoomOut' });
  if (cn(/旋转|转动/) || has('rotate', 'spin')) add({ type: 'rotate' });
  if (cn(/录制|录像/) || has('record', 'recording')) add({ type: 'record' });
  return acts;
}

/** Continuous speech recognition (Chrome / Edge: webkitSpeechRecognition). */
export class Voice {
  constructor(onText) {
    this.SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    this.supported = !!this.SR;
    this.onText = onText; this.on = false; this.rec = null; this.last = '';
  }
  start() {
    if (!this.SR) return false;
    const rec = new this.SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = 'zh-CN';
    rec.onresult = (e) => { const r = e.results[e.results.length - 1]; if (r.isFinal !== false) { this.last = r[0].transcript; this.onText(this.last); } };
    rec.onend = () => { if (this.on) { try { rec.start(); } catch { /* already running */ } } };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') this.on = false; };
    this.rec = rec; this.on = true;
    try { rec.start(); } catch { /* ignore double start */ }
    return true;
  }
  stop() { this.on = false; try { this.rec?.stop(); } catch { /* ignore */ } }
}

/** Read text aloud (Speech Synthesis). Returns false when the browser has no voice output. */
export function speak(text) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices?.() || [];
  const v = voices.find((x) => /^zh[-_]?(CN|Hans)/i.test(x.lang)) || voices.find((x) => /^zh/i.test(x.lang));
  if (v) u.voice = v;
  u.lang = v?.lang || 'zh-CN';
  u.rate = 1.0; u.pitch = 1.0;
  window.speechSynthesis.speak(u);
  return true;
}

/** Records the particle canvas + overlay (labels, hand skeleton) into a WebM video. */
export class Recorder {
  constructor(gl, overlay) { this.gl = gl; this.overlay = overlay; this.on = false; this.t0 = 0; }
  static supported() { return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream; }
  start() {
    const W = Math.min(this.gl.width, 1920), H = Math.round((W * this.gl.height) / this.gl.width);
    this.comp = document.createElement('canvas'); this.comp.width = W; this.comp.height = H;
    this.ctx = this.comp.getContext('2d');
    const stream = this.comp.captureStream(30);
    const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    this.type = type || 'video/webm';
    this.chunks = [];
    this.mr = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 8e6 } : undefined);
    this.mr.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.mr.start(250);
    this.on = true; this.t0 = performance.now();
  }
  /** Call right after drawing a frame (the WebGL buffer is still valid in the same task). */
  frame() {
    if (!this.on) return;
    const { ctx, comp } = this;
    ctx.drawImage(this.gl, 0, 0, comp.width, comp.height);
    ctx.drawImage(this.overlay, 0, 0, comp.width, comp.height);
  }
  seconds() { return this.on ? (performance.now() - this.t0) / 1000 : 0; }
  stop() {
    return new Promise((resolve) => {
      if (!this.on) { resolve(null); return; }
      this.mr.onstop = () => resolve(new Blob(this.chunks, { type: this.type }));
      this.frame(); this.mr.stop(); this.on = false;
    });
  }
}
