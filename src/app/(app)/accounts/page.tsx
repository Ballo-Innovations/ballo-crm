import type { Metadata } from "next";
import { forbidden, redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listAccounts } from "@/modules/accounts/queries";
import { parseListParams } from "@/modules/accounts/service";

import { AccountsList } from "./accounts-list";

export const metadata: Metadata = { title: "Accounts" };

/**
 * Accounts list (E2-01): search, sector/tier/lifecycle filters, sortable columns and pages,
 * all in the URL so a view can be shared. Reps see their team's accounts only (TC-03).
 */
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Faccounts");
  if (!can(user, "records.view")) forbidden();

  const params = parseListParams(await searchParams);
  const result = await listAccounts(user, params);

  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight">Accounts</h1>
      <section className="bg-card rounded-card p-4 md:p-[26px]">
        <AccountsList params={params} result={result} />
      </section>
    </>
  );
}
