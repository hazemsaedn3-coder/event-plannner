"use client";

import { useState, type ReactNode } from "react";

export interface GridItem {
  key: string;
  group: string;
  node: ReactNode;
}

/** Catalog grid with style filter chips (all designs stay in the HTML for SEO; filtering only hides). */
export function FilterableGrid({ items, groups, allLabel }: { items: GridItem[]; groups: { id: string; label: string }[]; allLabel: string }) {
  const [active, setActive] = useState("all");
  const present = groups.filter((g) => items.some((i) => i.group === g.id));
  const chip = (on: boolean) =>
    `f-body shrink-0 rounded-full border px-4 py-2 text-[14px] transition ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)]"}`;
  return (
    <>
      {present.length > 1 && (
        <div className="mb-7 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:justify-center" role="tablist">
          <button type="button" role="tab" aria-selected={active === "all"} className={chip(active === "all")} onClick={() => setActive("all")}>
            {allLabel} <span className="opacity-60">{items.length}</span>
          </button>
          {present.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={active === g.id} className={chip(active === g.id)} onClick={() => setActive(g.id)}>
              {g.label} <span className="opacity-60">{items.filter((i) => i.group === g.id).length}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
        {items.map((i) => (
          <li key={i.key} hidden={active !== "all" && i.group !== active} className="w-[80vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none">
            {i.node}
          </li>
        ))}
      </ul>
    </>
  );
}
