const STATS = [
  ["1", "record per customer"],
  ["4", "grades, Bronze to Platinum"],
  ["9", "modules, one login"],
  ["0", "spreadsheets to reconcile"],
] as const;

/** Four big numbers between hairlines, right under the product preview. */
export function StatsStrip() {
  return (
    <section
      aria-label="BalloCRM in numbers"
      className="mx-auto w-full max-w-[1180px] px-2 md:px-4"
    >
      <dl className="border-line grid grid-cols-2 border-y lg:grid-cols-4">
        {STATS.map(([n, label], i) => (
          <div
            key={label}
            className={
              "border-line flex flex-col-reverse px-5 py-6 md:px-7 md:py-8 " +
              (i % 2 ? "border-l " : "") +
              (i > 1 ? "border-t lg:border-t-0 " : "") +
              (i === 2 ? "lg:border-l" : "")
            }
          >
            <dt className="text-mute text-sm">{label}</dt>
            <dd className="text-[34px] leading-none font-bold tracking-[-0.04em] tabular-nums md:text-[44px]">
              {n}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
