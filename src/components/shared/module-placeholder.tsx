import { primaryNav } from "@/lib/site";

/** Scaffold-only page body. Each module's first ticket replaces it. */
export function ModulePlaceholder({ href }: { href: string }) {
  const item = primaryNav.find((entry) => entry.href === href);
  if (!item) return null;

  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight">{item.title}</h1>
      <section className="bg-card rounded-card p-[26px]">
        <h2 className="text-[22px] font-semibold">Not built yet</h2>
        <p className="text-mute mt-1.5 text-[15px]">{item.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="border-line bg-soft rounded-full border px-3 py-1.5">
            Epic {item.epic}
          </span>
          <span className="border-line bg-soft rounded-full border px-3 py-1.5 font-mono">
            {item.spec}
          </span>
        </div>
      </section>
    </>
  );
}
