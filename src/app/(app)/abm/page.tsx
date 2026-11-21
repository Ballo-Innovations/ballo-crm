import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "ABM" };

export default function AbmPage() {
  return <ModulePlaceholder href="/abm" />;
}
