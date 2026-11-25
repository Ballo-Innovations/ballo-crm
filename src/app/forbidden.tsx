import Link from "next/link";
import { ShieldOff } from "lucide-react";

/** 403 page, shown when a page calls `forbidden()` (role checks, E0-05). */
export default function Forbidden() {
  return (
    <main className="bg-main text-ink flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="bg-card rounded-card w-full max-w-[420px] p-[26px] text-center sm:p-9">
        <span className="bg-soft mx-auto mb-5 grid size-14 place-items-center rounded-full">
          <ShieldOff className="size-6" aria-hidden />
        </span>
        <h1 className="text-[26px] font-bold tracking-tight">You don&apos;t have access</h1>
        <p className="text-mute mt-1.5 text-[15px]">
          Your role can&apos;t open this page. Ask an admin if you need it.
        </p>
        <Link
          href="/dashboard"
          className="bg-ink text-shell mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-transform active:scale-[0.97]"
        >
          Back to the dashboard
        </Link>
      </section>
    </main>
  );
}
