"use client";

import type { ReactNode } from "react";

/** A form submit button that asks for confirmation first. */
export function ConfirmButton({ action, message, children }: { action: () => Promise<void>; message: string; children: ReactNode }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <button className="rounded-full border border-rose-200 px-3 py-1.5 text-rose-700 hover:bg-rose-50">{children}</button>
    </form>
  );
}
