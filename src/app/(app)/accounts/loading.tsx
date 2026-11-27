import { GhostRows, LoaderPill } from "@/components/shared/page-states";

/** First load of the accounts list: ghost rows (design system, "Empty, loading and error"). */
export default function Loading() {
  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight">Accounts</h1>
      <section className="bg-card rounded-card flex flex-col gap-4 p-4 md:p-[26px]">
        <LoaderPill label="Loading accounts" />
        <GhostRows count={6} />
      </section>
    </>
  );
}
