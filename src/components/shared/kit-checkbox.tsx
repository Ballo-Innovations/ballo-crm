"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

/** The UI kit's checkbox: 18px, 6px radius, black when checked, with a 24px+ hit area. */
export function KitCheckbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean | "indeterminate";
  onChange: () => void;
  /** Accessible name; leave out when a <label htmlFor={id}> names it. */
  label?: string;
  id?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="border-bar2 bg-card data-[state=checked]:bg-ink data-[state=checked]:border-ink data-[state=indeterminate]:bg-ink data-[state=indeterminate]:border-ink text-shell relative grid size-[18px] shrink-0 place-items-center rounded-[6px] border-2 after:absolute after:-inset-3"
    >
      <CheckboxPrimitive.Indicator>
        {checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
