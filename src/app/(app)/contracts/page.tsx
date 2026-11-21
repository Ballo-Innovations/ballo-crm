import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsPage() {
  return <ModulePlaceholder href="/contracts" />;
}
