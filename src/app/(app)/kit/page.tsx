import { Suspense } from "react";
import type { Metadata } from "next";

import { KitDemo } from "./kit-demo";

export const metadata: Metadata = { title: "Component kit" };

/** E0-08 demo page: every shared component, rendered with sample data. Not in the nav. */
export default function KitPage() {
  return (
    <Suspense>
      <KitDemo />
    </Suspense>
  );
}
