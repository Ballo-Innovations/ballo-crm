import { HeroLink } from "./hero-link";
import { BrandMark } from "./brand-logo";
import { WaveBackground } from "./wave-background";

/**
 * The closing island: always dark in both themes, like the login page's sign-in panel. It
 * re-points the colour tokens inside it so text, the button and the waves stay readable.
 */
const ISLAND_TOKENS = {
  "--ink": "#ffffff",
  "--shell": "#0d0d0d",
  "--card": "#1a1a1a",
  "--soft": "#222222",
  "--line": "#3a3a3a",
  "--mute": "#c4c4c4",
} as React.CSSProperties;

export function CtaSection() {
  return (
    <section id="sign-in" className="mx-auto w-full max-w-[1180px] scroll-mt-24 px-2 md:px-4">
      <div
        style={ISLAND_TOKENS}
        className="text-ink md:rounded-panel relative isolate overflow-hidden rounded-[28px] bg-[#0d0d0d] px-6 py-14 text-center md:px-14 md:py-[72px] dark:bg-[#050505] dark:ring-1 dark:ring-[#2a2a2a]"
      >
        <WaveBackground strength={0.8} flip />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <BrandMark />
          <h2 className="text-[34px] leading-[1.02] font-bold tracking-[-0.035em] text-balance md:text-[52px]">
            Your pipeline is waiting.
          </h2>
          <p className="text-mute text-[17px] md:text-lg">
            Invite-only workspace. Your admin manages access.
          </p>
          <HeroLink href="/login" className="mt-2 h-[52px] text-[15px]">
            Sign in
          </HeroLink>
        </div>
      </div>
    </section>
  );
}
