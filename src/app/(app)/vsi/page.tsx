import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "VSI" };

export default function VsiPage() {
  return <ModulePlaceholder href="/vsi" />;
}
