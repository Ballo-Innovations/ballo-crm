/**
 * Geometry for the landing page's gradient waves (design system, "Landing page").
 * Each wave is a sum of sines whose crest counts are whole numbers, so it repeats every
 * WAVE_PERIOD units and a drift of exactly one period loops with no visible jump.
 * Pure and deterministic: it renders on the server.
 */

export const WAVE_PERIOD = 1440;
export const WAVE_HEIGHT = 900;

export type WaveLayer = {
  /** Resting height of the wave line in the 1440 x 900 view box. */
  baseline: number;
  /** Height of the main swell. */
  amplitude: number;
  /** Whole crests per period for the main and the second swell. */
  crests: [number, number];
  phase: number;
  /** Peak fill opacity, before the per-placement strength is applied. */
  opacity: number;
  /** Seconds for one full drift. */
  drift: number;
};

export const waveLayers: WaveLayer[] = [
  { baseline: 360, amplitude: 58, crests: [2, 3], phase: 0.4, opacity: 0.055, drift: 52 },
  { baseline: 430, amplitude: 52, crests: [3, 2], phase: 2.1, opacity: 0.045, drift: 72 },
  { baseline: 500, amplitude: 46, crests: [2, 1], phase: 4.0, opacity: 0.04, drift: 44 },
  { baseline: 570, amplitude: 40, crests: [3, 1], phase: 1.2, opacity: 0.035, drift: 60 },
];

export function waveY(layer: WaveLayer, x: number): number {
  const t = (x / WAVE_PERIOD) * Math.PI * 2;
  const [k1, k2] = layer.crests;
  const { amplitude: a, phase: p } = layer;
  return (
    layer.baseline +
    a * Math.sin(k1 * t + p) +
    a * 0.3 * Math.sin(k2 * t + p * 1.7) +
    a * 0.08 * Math.sin((k1 + k2) * t + p * 0.6)
  );
}

/** SVG path over two periods; `closed` fills down to the bottom edge. */
export function wavePath(layer: WaveLayer, { closed }: { closed: boolean }): string {
  let d = "";
  for (let x = 0; x <= WAVE_PERIOD * 2; x += 12) {
    d += `${x === 0 ? "M" : "L"}${x} ${waveY(layer, x).toFixed(1)}`;
  }
  return closed ? `${d}L${WAVE_PERIOD * 2} ${WAVE_HEIGHT}L0 ${WAVE_HEIGHT}Z` : d;
}
