import { useId } from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Text field per docs/03-design/01-design-system.md "Forms": a 50px pill, label inside that
 * floats up and out on focus or once there is a value, ink border on focus, danger border and
 * an ⓘ message on error. Every field reserves 22px above for the floated label.
 */
export function PillField({
  label,
  error,
  help,
  className,
  id,
  ...input
}: Omit<React.ComponentProps<"input">, "placeholder"> & {
  label: string;
  error?: string;
  help?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? help;

  return (
    <div className={cn("relative flex min-w-0 flex-col gap-1.5 pt-[22px]", className)}>
      <div
        className={cn(
          "bg-soft flex h-[50px] items-center rounded-full border-[1.5px] border-transparent px-[18px] transition-colors duration-150",
          "focus-within:bg-card focus-within:border-ink",
          error && "border-danger focus-within:border-danger",
          input.disabled && "opacity-50",
        )}
      >
        <input
          id={inputId}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className="peer h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          {...input}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "text-mute pointer-events-none absolute top-[37px] left-5 text-[15px] font-medium transition-all duration-[180ms] ease-out",
            "peer-focus:text-ink peer-focus:top-0 peer-focus:left-2 peer-focus:text-[13px] peer-focus:font-semibold",
            "peer-[:not(:placeholder-shown)]:text-ink peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-[13px] peer-[:not(:placeholder-shown)]:font-semibold",
            error &&
              "text-danger peer-focus:text-danger peer-[:not(:placeholder-shown)]:text-danger",
          )}
        >
          {label}
        </label>
      </div>
      {note && (
        <p
          id={noteId}
          className={cn(
            "flex items-center gap-1 pl-[18px] text-xs",
            error ? "text-danger" : "text-mute",
          )}
        >
          {error && <Info className="size-3.5 shrink-0" aria-hidden />}
          {note}
        </p>
      )}
    </div>
  );
}
