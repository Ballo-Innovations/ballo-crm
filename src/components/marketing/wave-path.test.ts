import { describe, expect, it } from "vitest";

import { WAVE_PERIOD, waveLayers, wavePath, waveY } from "./wave-path";

// The waves drift left by exactly one period and loop, so a wave must end where it started
// (design system, "Landing page": slow, seamless, subtle).

describe("waveY", () => {
  it("repeats every period, so the drift loops without a jump", () => {
    for (const layer of waveLayers) {
      for (const x of [0, 137, 720, 1300]) {
        expect(waveY(layer, x + WAVE_PERIOD)).toBeCloseTo(waveY(layer, x), 6);
      }
    }
  });

  it("stays within the layer's swell, so it never spikes", () => {
    for (const layer of waveLayers) {
      for (let x = 0; x <= WAVE_PERIOD; x += 10) {
        const dy = Math.abs(waveY(layer, x) - layer.baseline);
        expect(dy).toBeLessThanOrEqual(layer.amplitude * 1.38 + 1e-9);
      }
    }
  });
});

describe("wavePath", () => {
  it("spans two periods so a one-period shift always covers the view", () => {
    const d = wavePath(waveLayers[0], { closed: false });
    expect(d.startsWith("M0 ")).toBe(true);
    expect(d).toContain(`L${WAVE_PERIOD * 2} `);
  });

  it("closes the filled shape along the bottom edge", () => {
    expect(wavePath(waveLayers[0], { closed: true })).toMatch(/L2880 900L0 900Z$/);
  });

  it("gives the same path every time (it renders on the server)", () => {
    expect(wavePath(waveLayers[1], { closed: true })).toBe(
      wavePath(waveLayers[1], { closed: true }),
    );
  });
});
