import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Forecast" };

export default function ForecastPage() {
  return <ModulePlaceholder href="/forecast" />;
}
