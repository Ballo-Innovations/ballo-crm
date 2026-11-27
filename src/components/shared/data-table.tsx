"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { KitCheckbox as Box } from "./kit-checkbox";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Money and counts: right-aligned, tabular figures. */
  numeric?: boolean;
  /** Dropped first when the drawer is docked (`compact`). */
  lowPriority?: boolean;
  /** Makes the header a sort button (with `sort` and `onSortChange` on the table). */
  sortKey?: string;
  className?: string;
};

export type TableSort = { key: string; dir: "asc" | "desc" };

export type RowAction<T> = {
  label: string;
  onSelect: (row: T) => void;
  danger?: boolean;
};

/**
 * DataTable per the design system: separated rounded `--soft` rows, checkbox column,
 * ⋯ row menu. On phones rows become stacked cards. Selection and the open row are
 * controlled by the page.
 */
export function DataTable<T>({
  label,
  rows,
  columns,
  getRowId,
  primary,
  selected,
  onSelectedChange,
  openId,
  onRowClick,
  rowActions,
  compact,
  sort,
  onSortChange,
}: {
  /** Accessible name, e.g. "Leads". */
  label: string;
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** The column shown as the card title on phones (defaults to the first). */
  primary?: string;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  openId?: string | null;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  compact?: boolean;
  /** The current sort; the page sorts the rows (usually on the server). */
  sort?: TableSort;
  onSortChange?: (key: string) => void;
}) {
  const cols = columns.filter((c) => !(compact && c.lowPriority));
  const selectable = !!selected && !!onSelectedChange;
  const all = rows.length > 0 && rows.every((r) => selected?.has(getRowId(r)));
  const some = !all && rows.some((r) => selected?.has(getRowId(r)));
  const first = columns.find((c) => c.key === primary) ?? columns[0]!;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange?.(next);
  }

  return (
    <>
      <table
        aria-label={label}
        className="hidden w-full border-separate border-spacing-y-2 md:table"
      >
        <thead>
          <tr className="text-mute text-left text-xs">
            {selectable && (
              <th className="w-10 px-3.5 font-medium">
                <Box
                  checked={all ? true : some ? "indeterminate" : false}
                  onChange={() => onSelectedChange!(all ? new Set() : new Set(rows.map(getRowId)))}
                  label="Select all rows"
                />
              </th>
            )}
            {cols.map((c) => {
              const sortable = !!c.sortKey && !!onSortChange;
              const active = sortable && sort?.key === c.sortKey;
              const Arrow = !active ? ChevronsUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn("px-3.5 py-1 font-medium", c.numeric && "text-right", c.className)}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange!(c.sortKey!)}
                      className={cn(
                        "hover:text-ink -mx-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors",
                        c.numeric && "flex-row-reverse",
                        active && "text-ink font-semibold",
                      )}
                    >
                      {c.header}
                      <Arrow aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
            {rowActions && (
              <th className="w-12">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row);
            const open = openId === id;
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                aria-selected={selectable ? selected!.has(id) : undefined}
                className={cn(
                  "bg-soft hover:bg-line text-sm transition-colors duration-150 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl",
                  onRowClick && "cursor-pointer",
                  // rounded 2px ring: inset shadows on the cells follow their radii
                  open &&
                    "[&>td]:shadow-[inset_0_2px_0_var(--ink),inset_0_-2px_0_var(--ink)] [&>td:first-child]:shadow-[inset_2px_2px_0_var(--ink),inset_0_-2px_0_var(--ink)] [&>td:last-child]:shadow-[inset_-2px_2px_0_var(--ink),inset_0_-2px_0_var(--ink)]",
                )}
              >
                {selectable && (
                  <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                    <Box
                      checked={selected!.has(id)}
                      onChange={() => toggle(id)}
                      label="Select row"
                    />
                  </td>
                )}
                {cols.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3.5 py-3",
                      c.numeric && "text-right tabular-nums",
                      i === 0 && "font-semibold",
                      c.className,
                    )}
                  >
                    {i === 0 && onRowClick ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row);
                        }}
                        className="text-left"
                      >
                        {c.cell(row)}
                      </button>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowMenu row={row} actions={rowActions} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* phone: stacked cards */}
      <ul aria-label={label} className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => {
          const id = getRowId(row);
          return (
            <li
              key={id}
              className={cn(
                "bg-soft rounded-2xl p-3.5",
                openId === id && "outline-ink outline-2 -outline-offset-2",
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <Box checked={selected!.has(id)} onChange={() => toggle(id)} label="Select row" />
                )}
                <button
                  type="button"
                  disabled={!onRowClick}
                  onClick={() => onRowClick?.(row)}
                  className="min-w-0 flex-1 text-left text-sm font-semibold"
                >
                  {first.cell(row)}
                </button>
                {rowActions && <RowMenu row={row} actions={rowActions} />}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                {columns
                  .filter((c) => c.key !== first.key)
                  .map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-mute text-xs">{c.header}</dt>
                      <dd className={cn("truncate", c.numeric && "tabular-nums")}>{c.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function RowMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Row actions"
        className="hover:bg-card grid size-8 place-items-center rounded-full transition-colors"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card text-ink w-56 rounded-[18px] border-0 p-2 shadow-[0_18px_48px_rgb(0_0_0/0.16)]"
      >
        {actions.map((a) => (
          <DropdownMenuItem
            key={a.label}
            onSelect={() => a.onSelect(row)}
            className={cn(
              "focus:bg-soft rounded-2xl px-3 py-2.5 text-sm font-medium",
              a.danger && "text-danger focus:text-danger",
            )}
          >
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
