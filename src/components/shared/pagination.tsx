"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Previous / next under a list, with "Page 2 of 5". Hidden when everything fits on one page. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const button =
    "bg-soft hover:bg-line grid size-10 place-items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
      <span className="text-mute mr-1 text-[13px] tabular-nums">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={button}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className={button}
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </nav>
  );
}
