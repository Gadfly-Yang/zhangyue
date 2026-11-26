// Webcam + MediaPipe HandLandmarker (VIDEO mode). On phones, keep inference off the rendering thread.
const VISION = new URL('../vendor/mediapipe/vision_bundle.mjs', import.meta.url).href;
const WASM = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) <= 500;
const MODEL = new URL(MOBILE ? '../models/hand_landmarker_lite.task' : '../models/hand_landmarker.task', import.meta.url).href;
const MODEL_CACHE = 'wanxiang-hand-model';
// Update the relevant SHA-256 when replacing a model file.
const MODEL_VERSION = MOBILE
  ? '089dd10e466d89211c52a66fd1d89ad4b1267a5e56179ae0c8529c7bec834b22'
  : 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1';
const ENGINE_CACHE = 'wanxiang-hand-engine';
// Content fingerprints of the two WASM builds selected by FilesetResolver.
const WASM_VERSIONS = {
  'vision_wasm_internal.wasm': '8da277a733926eac',
  'vision_wasm_nosimd_internal.wasm': 'a28483cd42e74e85',
};

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function trackerOptions(model, delegate) {
  return {
    baseOptions: { modelAssetBuffer: model, delegate },
    runningMode: 'VIDEO', numHands: 2,
    minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  };
}

async function loadMobileWasm(url, signal) {
  const version = WASM_VERSIONS[new URL(url).pathname.split('/').pop()];
  let cache;
  if (version) {
    try {
      cache = await globalThis.caches?.open(ENGINE_CACHE);
      const cached = await cache?.match(url);
      if (cached?.headers.get('X-Engine-Version') === version) return await cached.blob();
    } catch {
      // Continue over the network when browser storage is unavailable.
    }
  }
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`手势引擎下载失败（HTTP ${response.status}）`);
  const binary = await response.blob();
  if (await binary.slice(0, 4).text() !== '\0asm') throw new Error('手势引擎文件无效，请重试');
  if (cache && !signal.aborted) {
    void cache.put(url, new Response(binary, { headers: { 'X-Engine-Version': version } })).catch(() => {});
  }
  return binary;
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
    this.worker = null;
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
    // Leave room for the 33 ms interval of a 30 fps camera without skipping every other frame.
    this.minGap = MOBILE ? 28 : 0;
    this.newFrame = false;
    this.pendingFrame = false;
    this.result = undefined;
    this.sampleTime = 0;
    this.videoFrameTime = null;
    this.videoCallback = null;
  }

  start(onStatus = () => {}) {
    this.starting ??= this.startTracking(onStatus).finally(() => { this.starting = null; });
    return this.starting;
  }

  async startTracking(onStatus) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('这个浏览器无法访问摄像头（需要 https 或 localhost）。');
    onStatus('正在请求摄像头…');
    const video = MOBILE ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { ideal: 30 } };
    const camera = navigator.mediaDevices.getUserMedia({ video, audio: false });
    const download = new AbortController();
    let showProgress = false;
    let engineReady = false;
    let wasmPreload, wasmUrl;

    const engine = withTimeout(import(VISION), 25000, '手势引擎下载超时，请检查网络后重试')
      .then(async ({ FilesetResolver, HandLandmarker }) => {
        const fileset = await withTimeout(FilesetResolver.forVisionTasks(WASM), 30000, '手势引擎初始化超时，请重试');
        if (MOBILE) {
          const binary = await withTimeout(loadMobileWasm(fileset.wasmBinaryPath, download.signal),
            45000, '手势引擎下载超时，请检查网络后重试');
          if (!download.signal.aborted) {
            wasmUrl = URL.createObjectURL(new Blob([binary], { type: 'application/wasm' }));
          }
        } else if (!download.signal.aborted) {
          // Match MediaPipe's fetch so it can reuse the selected WASM download.
          wasmPreload = document.createElement('link');
          wasmPreload.rel = 'preload';
          wasmPreload.as = 'fetch';
          wasmPreload.crossOrigin = 'anonymous';
          wasmPreload.href = fileset.wasmBinaryPath;
          document.head.append(wasmPreload);
        }
        engineReady = true;
        return { HandLandmarker, fileset };
      });
    const model = loadModel((status) => {
      if (showProgress) onStatus(status);
    }, download.signal).then((buffer) => {
      if (MOBILE && showProgress && !engineReady) onStatus('正在下载手势引擎…');
      return buffer;
    });
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
      const localFileset = wasmUrl ? { ...fileset, wasmBinaryPath: wasmUrl } : fileset;
      const gpu = new URLSearchParams(location.search).get('gpu');
      let delegate = gpu === '0' || (MOBILE && gpu !== '1') ? 'CPU' : 'GPU';
      let secs = 0;
      const tick = setInterval(() => {
        onStatus(`${delegate} 初始化中…已等待 ${++secs} 秒`);
      }, 1000);
      onStatus(`${delegate} 初始化中…`);
      try {
        const make = (kind, paths = localFileset) => HandLandmarker.createFromOptions(paths, trackerOptions(modelBuf, kind));
        if (MOBILE && delegate === 'CPU' && typeof Worker === 'function' && typeof OffscreenCanvas === 'function'
            && typeof createImageBitmap === 'function') {
          try {
            await this.startWorker(localFileset, modelBuf, () => this.recoverWorker(() => make('CPU', fileset), onStatus));
          } catch (error) {
            this.worker?.terminate();
            this.worker = null;
            console.warn('手势追踪线程不可用', error);
          }
        }
        if (!this.worker && delegate === 'GPU') {
          try {
            this.landmarker = await withTimeout(make('GPU'), MOBILE ? 6000 : 60000, 'GPU 初始化超时');
          } catch (error) {
            console.warn('GPU 不可用，改用 CPU', error);
          }
        }
        if (!this.worker && !this.landmarker) {
          delegate = 'CPU';
          onStatus('CPU 初始化中…');
          this.landmarker = await withTimeout(make('CPU'), MOBILE ? 20000 : 90000, '手势模型初始化超时，请重试');
        }
      } finally {
        clearInterval(tick);
      }
      this.delegate = delegate;
      this.running = true;
      this._t = performance.now();
      if (this.video.requestVideoFrameCallback) {
        const onVideoFrame = (_, metadata) => {
          this.videoFrameTime = metadata.mediaTime;
          if (this.running) this.videoCallback = this.video.requestVideoFrameCallback(onVideoFrame);
        };
        this.videoCallback = this.video.requestVideoFrameCallback(onVideoFrame);
      }
      onStatus('');
    } catch (e) {
      this.stop();
      throw e;
    } finally {
      download.abort();
      wasmPreload?.remove();
      if (wasmUrl) URL.revokeObjectURL(wasmUrl);
    }
  }

  async startWorker(fileset, model, onFailure) {
    const worker = new Worker(new URL('./hands-worker.js', import.meta.url));
    this.worker = worker;
    this.workerFailure = onFailure;
    await withTimeout(new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.type === 'ready') resolve();
        else reject(new Error(data.message));
      };
      worker.onerror = (event) => { event.preventDefault(); reject(new Error(event.message)); };
      worker.postMessage({ type: 'start', vision: VISION, fileset, options: trackerOptions(model, 'CPU') });
    }), 10000, '手势追踪线程初始化超时');
    worker.onmessage = ({ data }) => {
      this.pendingFrame = false;
      if (data.type === 'error') { onFailure(); return; }
      this.recordFrame(data.elapsed, data.time);
      this.result = data.hands;
    };
    worker.onerror = (event) => { event.preventDefault(); onFailure(); };
  }

  recoverWorker(make, onStatus) {
    if (!this.worker) return;
    this.worker.terminate();
    this.worker = null;
    this.workerFailure = null;
    this.pendingFrame = false;
    onStatus('正在恢复手势追踪…');
    void make().then((tracker) => {
      if (this.running) { this.landmarker = tracker; onStatus(''); }
      else tracker.close();
    }).catch((error) => {
      if (this.running) { this.stop(); onStatus(`手势追踪恢复失败：${error.message}`); }
    });
  }

  /** Returns undefined when there is no new camera frame, else a list of hands (mirrored, selfie view), possibly empty. */
  poll(time = performance.now() / 1000) {
    const result = this.result;
    this.result = undefined;
    const v = this.video;
    const videoTime = this.videoFrameTime ?? v.currentTime;
    if (!this.running || v.readyState < 2 || videoTime === this.lastVideoTime) return result;
    const now0 = performance.now();
    this.lastVideoTime = videoTime;
    this.newFrame = true;
    const gap = MOBILE && !this.worker ? Math.max(this.minGap, Math.min(90, this.detectMs * 2)) : this.minGap;
    if (this.pendingFrame || now0 - this._lastPoll < gap) return result;
    this._lastPoll = now0;
    const ts = Math.max(Math.round(now0), this.lastTs + 1);      // must strictly increase
    this.lastTs = ts;
    if (this.worker) {
      const worker = this.worker;
      this.pendingFrame = true;
      void createImageBitmap(v).then((image) => {
        if (this.worker !== worker) { image.close(); return; }
        try { worker.postMessage({ type: 'frame', image, ts, time }, [image]); }
        catch (error) { image.close(); throw error; }
      }).catch(() => { if (this.worker === worker) this.workerFailure?.(); });
      return result;
    }
    if (!this.landmarker) return result;
    const t0 = performance.now();
    const res = this.landmarker.detectForVideo(v, ts);
    this.recordFrame(performance.now() - t0, time);
    return (res.landmarks || []).map((lm) => lm.map((p) => [1 - p.x, p.y]));   // mirror x: selfie view
  }

  recordFrame(elapsed, time) {
    this.detectMs = elapsed;
    this.sampleTime = time;
    this.frames++; this._n++;
    const now = performance.now();
    if (now - this._t > 1000) { this.fps = (this._n * 1000) / (now - this._t); this._n = 0; this._t = now; }
  }

  stop() {
    this.running = false;
    if (this.videoCallback !== null) this.video.cancelVideoFrameCallback?.(this.videoCallback);
    this.videoCallback = null;
    this.worker?.terminate();
    this.worker = null;
    this.workerFailure = null;
    this.pendingFrame = false;
    this.result = undefined;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.landmarker?.close?.();
    this.landmarker = null;
  }
}
