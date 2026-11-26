import { useId } from "react";

import { cn } from "@/lib/utils";

import { WAVE_HEIGHT, WAVE_PERIOD, waveLayers, wavePath } from "./wave-path";

/**
 * Subtle gradient waves behind a section (design system, "Landing page"). Drawn in
 * currentColor from --ink at a few percent opacity, so they stay monochrome in both themes
 * and turn white inside the dark island. They drift slowly; the global reduced-motion rule
 * stops them. Decorative only. The parent needs `relative isolate overflow-hidden`.
 */
export function WaveBackground({
  strength = 1,
  flip = false,
  className,
}: {
  /** Multiplies every layer's opacity: about 1 on white, 0.8 on the dark island. */
  strength?: number;
  /** Mirror vertically, for waves that rise from the top of a dark panel. */
  flip?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const outlined = [0, 2];

  return (
    <div
      aria-hidden="true"
      data-wave
      className={cn(
        "text-ink pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[1000px]",
        "[mask-image:linear-gradient(to_bottom,#000_55%,transparent_98%)]",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${WAVE_PERIOD} ${WAVE_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
      >
        <defs>
          {waveLayers.map((layer, i) => (
            <linearGradient key={i} id={`${id}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0.45"
                stopColor="currentColor"
                stopOpacity={Math.min(layer.opacity * strength, 1)}
              />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id={`${id}-blur`} x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <g transform={flip ? `scale(1,-1) translate(0,-${WAVE_HEIGHT})` : undefined}>
          <g filter={`url(#${id}-blur)`}>
            {waveLayers.map((layer, i) => (
              <g key={i} style={bob(i)}>
                <path
                  d={wavePath(layer, { closed: true })}
                  fill={`url(#${id}-g${i})`}
                  style={drift(layer.drift, i)}
                />
              </g>
            ))}
          </g>
          {outlined.map((i) => (
            <g key={i} style={bob(i)}>
              <path
                d={wavePath(waveLayers[i], { closed: false })}
                fill="none"
                stroke="currentColor"
                strokeOpacity={Math.min(0.08 * strength, 1)}
                strokeWidth={1}
                style={drift(waveLayers[i].drift, i)}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

const drift = (seconds: number, i: number): React.CSSProperties => ({
  animation: `wave-drift ${seconds}s linear infinite${i % 2 ? " reverse" : ""}`,
});

const bob = (i: number): React.CSSProperties => ({
  animation: `wave-bob ${12 + i * 5}s ease-in-out infinite alternate`,
});
