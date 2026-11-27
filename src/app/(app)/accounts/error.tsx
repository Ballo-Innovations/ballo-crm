"use client";

import { ErrorState } from "@/components/shared/page-states";

/** The accounts list could not load: say so and offer a retry. */
export default function AccountsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight">Accounts</h1>
      <section className="bg-card rounded-card p-4 md:p-[26px]">
        <ErrorState
          title="Accounts didn't load"
          text="Something went wrong on our side. Try again in a moment."
          onRetry={reset}
        />
      </section>
    </>
  );
}
