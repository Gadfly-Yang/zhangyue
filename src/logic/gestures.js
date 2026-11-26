// Hand pose (OPEN / FIST / PEACE / OTHER), continuous openness, and snap detection from MediaPipe's
// 21 normalized landmarks. Static poses are based on wondersnap/gestures.py.
export const WRIST = 0, THUMB_TIP = 4, MIDDLE_MCP = 9, MIDDLE_TIP = 12;
export const TIPS = [8, 12, 16, 20], PIPS = [6, 10, 14, 18], MCPS = [5, 9, 13, 17];
export const OPEN = 'open', FIST = 'fist', PEACE = 'peace', POINT = 'point', OTHER = 'other', NONE = 'none';

export const STANDARD = Object.freeze({
  extendedFingerRatio: 1.15,
  curledFingerRatio: 1.25,
  openThumbRatio: 1.1,
  opennessFingerClosed: 1.05,
  opennessFingerOpen: 1.75,
  opennessThumbClosed: 0.9,
  opennessThumbOpen: 1.55,
});

// A single 0.03 normalized-ratio tolerance admits mildly bent synthetic poses while keeping a broad
// OTHER band between fist and open. Marginal tests sit halfway between the old and new boundaries,
// and openness endpoints move inward by the same bounded amount instead of adding separate tuning.
// Snap and pinch are independent of the selected static-pose profile.
export const FORGIVING = Object.freeze({
  extendedFingerRatio: 1.12,
  curledFingerRatio: 1.28,
  openThumbRatio: 1.07,
  opennessFingerClosed: 1.08,
  opennessFingerOpen: 1.72,
  opennessThumbClosed: 0.93,
  opennessThumbOpen: 1.52,
});

export const GESTURE_PROFILES = Object.freeze({ standard: STANDARD, forgiving: FORGIVING });

const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const handScale = (lm) => Math.max(d(lm[WRIST], lm[MIDDLE_MCP]), 1e-6);

/** Instant pose. Finger extended = tip clearly farther from wrist than its PIP joint (rotation-invariant). */
export function classify(lm, profile = STANDARD) {
  if (!lm) return NONE;
  const ext = TIPS.map((t, i) => d(lm[t], lm[WRIST]) > d(lm[PIPS[i]], lm[WRIST]) * profile.extendedFingerRatio);
  const curled = TIPS.map((t, i) => d(lm[t], lm[WRIST]) < d(lm[MCPS[i]], lm[WRIST]) * profile.curledFingerRatio);
  const thumbOut = d(lm[THUMB_TIP], lm[17]) > handScale(lm) * profile.openThumbRatio;  // thumb tip far from pinky base
  if (ext.every(Boolean) && thumbOut) return OPEN;
  if (curled.every(Boolean)) return FIST;
  if (ext[0] && ext[1] && curled[2] && curled[3]) return PEACE;           // ✌ index + middle up
  if (ext[0] && curled[1] && curled[2] && curled[3]) return POINT;        // ☝ index finger only
  return OTHER;
}

/** Pinch: thumb tip touching the index tip (not a fist, where they are also close). */
export function pinched(lm) {
  if (!lm) return false;
  // Pinch safety is invariant across static-gesture sensitivity presets.
  return d(lm[THUMB_TIP], lm[8]) / handScale(lm) < 0.32 && classify(lm) !== FIST;
}

export const middleExtended = (lm) => d(lm[MIDDLE_TIP], lm[WRIST]) > d(lm[10], lm[WRIST]) * 1.15;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** How open the hand is, 0 = tight fist .. 1 = fully open (fingers 80 %, thumb 20 %). */
export function openness(lm, profile = STANDARD) {
  if (!lm) return 0;
  let f = 0;
  for (let i = 0; i < 4; i++) {
    const ratio = d(lm[TIPS[i]], lm[WRIST]) / Math.max(d(lm[MCPS[i]], lm[WRIST]), 1e-6);
    f += clamp01((ratio - profile.opennessFingerClosed) / (profile.opennessFingerOpen - profile.opennessFingerClosed));
  }
  const thumbRatio = d(lm[THUMB_TIP], lm[17]) / handScale(lm);
  const thumb = clamp01((thumbRatio - profile.opennessThumbClosed) / (profile.opennessThumbOpen - profile.opennessThumbClosed));
  return 0.8 * (f / 4) + 0.2 * thumb;
}

/** A pose must be seen for `hold` consecutive frames (per-pose override) before it becomes the stable pose. */
export class PoseDebouncer {
  constructor(hold = 4, holdFor = { [PEACE]: 6 }) {
    this.hold = hold; this.holdFor = holdFor;
    this.stable = NONE; this.cand = NONE; this.n = 0;
  }
  update(pose) {
    if (pose === this.cand) this.n += 1;
    else { this.cand = pose; this.n = 1; }
    let changed = false;
    if (this.n >= (this.holdFor[pose] ?? this.hold) && pose !== this.stable) { this.stable = pose; changed = true; }
    return [this.stable, changed];
  }
}

/** A snap starts with thumb–middle contact and ends as the middle finger folds toward the palm. */
export class SnapDetector {
  constructor({ close = 0.44, open = 0.52, maxReleaseS = 0.18, cooldownS = 0.8, dropoutS = 0.12 } = {}) {
    Object.assign(this, { close, open, maxReleaseS, cooldownS, dropoutS });
    this.press = null;
    this.hadDropout = false;
    this.lastFire = -Infinity;
  }

  update(lm, t, aspect = 1) {
    if (!lm) {
      this.hadDropout = true;
      if (this.press && t - this.press.t > this.maxReleaseS + this.dropoutS) this.press = null;
      return false;
    }

    // Map normalized camera coordinates to the same units on both axes before measuring the hand.
    const wrist = lm[WRIST], knuckle = lm[MIDDLE_MCP], middle = lm[MIDDLE_TIP], thumb = lm[THUMB_TIP];
    const palmX = (knuckle[0] - wrist[0]) * aspect, palmY = knuckle[1] - wrist[1];
    const palmLength = Math.hypot(palmX, palmY);
    if (palmLength < 1e-6) {
      this.press = null;
      return false;
    }

    const gap = Math.hypot((thumb[0] - middle[0]) * aspect, thumb[1] - middle[1]) / palmLength;
    // The palm axis measures flexion independently of the hand's rotation in the image.
    // Its origin is the wrist (0) and the middle knuckle is one palm length away (1).
    const middleReach = ((middle[0] - wrist[0]) * aspect * palmX + (middle[1] - wrist[1]) * palmY) / (palmLength * palmLength);
    if (gap < this.close) {
      const index = lm[TIPS[0]];
      const indexGap = Math.hypot((thumb[0] - index[0]) * aspect, thumb[1] - index[1]) / palmLength;
      // The middle fingertip is near the knuckle in the ready pose and the thumb is clear of the index.
      const nearKnuckle = middleReach >= 0.9;
      const indexClear = indexGap > 0.32 && indexGap - gap > 0.05;
      if (!indexClear || (!nearKnuckle && gap < 0.22)) {
        this.press = null;
      } else if (nearKnuckle) {
        this.press = { t, gap, middleReach };
        this.hadDropout = false;
      }
      // A curled middle finger with the tips starting to part can be a frame mid-release.
      return false;
    }

    const press = this.press;
    if (!press) return false;
    const elapsed = t - press.t;
    if (elapsed <= 0 || elapsed > this.maxReleaseS + (this.hadDropout ? this.dropoutS : 0)) {
      this.press = null;
      return false;
    }
    if (gap < this.open || gap - press.gap < 0.18 || press.middleReach - middleReach < 0.12) return false;

    this.press = null;
    if (t - this.lastFire < this.cooldownS) return false;
    this.lastFire = t;
    return true;
  }
}
