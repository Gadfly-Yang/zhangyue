// Classic worker so MediaPipe can load its WASM glue with importScripts().
let tracker;

self.onmessage = async ({ data }) => {
  if (data.type === 'start') {
    try {
      const { HandLandmarker } = await import(data.vision);
      tracker = await HandLandmarker.createFromOptions(data.fileset, {
        ...data.options, canvas: new OffscreenCanvas(1, 1),
      });
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', message: String(error.message || error) });
    }
    return;
  }

  const { image, ts, time } = data;
  try {
    const start = performance.now();
    const { landmarks } = tracker.detectForVideo(image, ts);
    const hands = landmarks.map((hand) => hand.map((point) => [1 - point.x, point.y]));
    self.postMessage({ type: 'frame', hands, time, elapsed: performance.now() - start });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error.message || error) });
  } finally {
    image.close();
  }
};
