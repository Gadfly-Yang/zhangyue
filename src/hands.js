// Webcam + MediaPipe HandLandmarker (Tasks API, VIDEO mode). The render loop calls poll() once per frame;
// detection only runs when the camera delivered a new frame, and timestamps strictly increase.
const VISION = new URL('../vendor/mediapipe/vision_bundle.mjs', import.meta.url).href;
const WASM = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL = new URL('../models/hand_landmarker.task', import.meta.url).href;
const MODEL_CACHE = 'wanxiang-hand-model';
// SHA-256 of hand_landmarker.task. Update this when replacing the model file.
const MODEL_VERSION = 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1';
const MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) <= 500;

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchModel(url, onStatus, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`模型下载失败（HTTP ${res.status}）`);
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  let shown = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    const now = performance.now();
    if (now - shown > 200) {
      shown = now;
      onStatus(`正在下载手势模型 ${(got / 1048576).toFixed(1)} MB`);
    }
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function loadModel(onStatus, signal) {
  let cache;
  try {
    cache = await globalThis.caches?.open(MODEL_CACHE);
    const cached = await cache?.match(MODEL);
    if (cached?.headers.get('X-Model-Version') === MODEL_VERSION) {
      return new Uint8Array(await cached.arrayBuffer());
    }
  } catch {
    // The tracker still works when browser storage is unavailable.
  }

  const model = await fetchModel(MODEL, onStatus, signal);
  if (cache && !signal.aborted) {
    // Verify the complete download before caching it, off the startup path.
    void globalThis.crypto?.subtle?.digest('SHA-256', model).then((hash) => {
      const version = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
      if (version === MODEL_VERSION) {
        return cache.put(MODEL, new Response(model, { headers: { 'X-Model-Version': version } }));
      }
    }).catch(() => {});
  }
  return model;
}

export class HandCamera {
  constructor(video) {
    this.video = video;
    this.starting = null;
    this.landmarker = null;
    this.stream = null;
    this.running = false;
    this.delegate = null;
    this.lastVideoTime = -1;
    this.lastTs = 0;
    this.frames = 0;             // camera frames processed
    this.fps = 0;
    this.detectMs = 0;
    this._n = 0; this._t = performance.now();
    this._lastPoll = 0;
    this.minGap = MOBILE ? 45 : 0;   // phones: run the tracker at ~20 fps to save battery
    this.newFrame = false;       // a new video frame arrived since the last poll (renderer uploads it)
  }

  start(onStatus = () => {}) {
    this.starting ??= this.startTracking(onStatus).finally(() => { this.starting = null; });
    return this.starting;
  }

  async startTracking(onStatus) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('这个浏览器无法访问摄像头（需要 https 或 localhost）。');
    onStatus('正在请求摄像头…');
    const video = MOBILE ? { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { ideal: 24 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { ideal: 30 } };
    const camera = navigator.mediaDevices.getUserMedia({ video, audio: false });
    const download = new AbortController();
    let showProgress = false;
    let wasmPreload;

    const engine = withTimeout(import(VISION), 25000, '手势引擎下载超时，请检查网络后重试')
      .then(async ({ FilesetResolver, HandLandmarker }) => {
        const fileset = await withTimeout(FilesetResolver.forVisionTasks(WASM), 30000, '手势引擎初始化超时，请重试');
        if (!download.signal.aborted) {
          // Match MediaPipe's fetch so it can reuse the selected WASM download.
          wasmPreload = document.createElement('link');
          wasmPreload.rel = 'preload';
          wasmPreload.as = 'fetch';
          wasmPreload.crossOrigin = 'anonymous';
          wasmPreload.href = fileset.wasmBinaryPath;
          document.head.append(wasmPreload);
        }
        return { HandLandmarker, fileset };
      });
    const model = loadModel((status) => {
      if (showProgress) onStatus(status);
    }, download.signal);
    const assets = Promise.all([engine, model]);
    // Keep the camera permission result first even if a download fails while it is pending.
    void assets.catch(() => {});

    try {
      this.stream = await camera;
      this.video.srcObject = this.stream;
      this.video.muted = true; this.video.playsInline = true;
      await this.video.play();
      showProgress = true;
      onStatus('正在加载手势识别引擎…');
      const [{ HandLandmarker, fileset }, modelBuf] = await assets;
      const make = (delegate) => HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: modelBuf, delegate },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      const wantsCpu = new URLSearchParams(location.search).get('gpu') === '0';
      let delegate = wantsCpu ? 'CPU' : 'GPU';
      let secs = 0;
      const tick = setInterval(() => {
        onStatus(`${delegate} 初始化中…已等待 ${++secs} 秒`);
      }, 1000);
      onStatus(`${delegate} 初始化中…`);
      try {
        try {
          this.landmarker = await withTimeout(make(delegate), 60000, 'GPU 初始化超时');
        } catch (e) {
          if (wantsCpu) throw e;
          console.warn('GPU 不可用，改用 CPU', e);
          delegate = 'CPU';
          onStatus('GPU 不可用，改用 CPU 初始化…');
          this.landmarker = await withTimeout(make(delegate), 90000, '手势模型初始化超时，请重试');
        }
      } finally {
        clearInterval(tick);
      }
      this.delegate = delegate;
      this.running = true;
      onStatus('');
    } catch (e) {
      this.stop();
      throw e;
    } finally {
      download.abort();
      wasmPreload?.remove();
    }
  }

  /** Returns undefined when there is no new camera frame, else a list of hands (mirrored, selfie view), possibly empty. */
  poll() {
    const v = this.video;
    if (!this.running || v.readyState < 2 || v.currentTime === this.lastVideoTime) return undefined;
    const now0 = performance.now();
    if (now0 - this._lastPoll < this.minGap) return undefined;
    this._lastPoll = now0;
    this.lastVideoTime = v.currentTime;
    this.newFrame = true;
    const ts = Math.max(Math.round(now0), this.lastTs + 1);      // must strictly increase
    this.lastTs = ts;
    const t0 = performance.now();
    const res = this.landmarker.detectForVideo(v, ts);
    this.detectMs = performance.now() - t0;
    this.frames++; this._n++;
    const now = performance.now();
    if (now - this._t > 1000) { this.fps = (this._n * 1000) / (now - this._t); this._n = 0; this._t = now; }
    return (res.landmarks || []).map((lm) => lm.map((p) => [1 - p.x, p.y]));   // mirror x: selfie view
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.landmarker?.close?.();
    this.landmarker = null;
  }
}
