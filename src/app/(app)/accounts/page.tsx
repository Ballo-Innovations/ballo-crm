import type { Metadata } from "next";
import { forbidden, redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  canEditAccount,
  getAccountOverview,
  listAccounts,
  listContacts,
} from "@/modules/accounts/queries";
import { parseListParams } from "@/modules/accounts/service";

import { AccountsList } from "./accounts-list";

export const metadata: Metadata = { title: "Accounts" };

/**
 * Accounts list (E2-01): search, sector/tier/lifecycle filters, sortable columns and pages,
 * all in the URL so a view can be shared. Reps see their team's accounts only (TC-03).
 * `?open=<id>` opens the account in the docked drawer: header and Overview tab (E2-02);
 * `&section=contacts` shows its Contacts tab (E2-03).
 */
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Faccounts");
  if (!can(user, "records.view")) forbidden();

  const raw = await searchParams;
  const params = parseListParams(raw);
  const openId = typeof raw.open === "string" && raw.open ? raw.open : null;
  const section = openId && raw.section === "contacts" ? "contacts" : "overview";
  const [result, overview, contacts, canEdit] = await Promise.all([
    listAccounts(user, params),
    // A failed drawer load shows its own error; it must not take the list down with it.
    openId ? getAccountOverview(user, openId).catch(() => "error" as const) : null,
    openId && section === "contacts"
      ? listContacts(user, openId)
          .then((c) => c ?? [])
          .catch(() => "error" as const)
      : null,
    openId ? canEditAccount(user, openId).catch(() => false) : false,
  ]);

  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight">Accounts</h1>
      <AccountsList
        params={params}
        result={result}
        openId={openId}
        overview={overview}
        section={section}
        contacts={contacts}
        canEdit={canEdit}
      />
    </>
  );
}
