"use client";

import { useActionState } from "react";
import { login } from "@/app/(admin)/admin/actions";

export function LoginFormClient({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const field =
    "w-full rounded-xl border border-[#E1D5BE] bg-white px-4 py-3 text-[16px] outline-none transition focus:border-[#B08A45] focus:ring-2 focus:ring-[#B08A45]/20";
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1.5 text-[14px] text-[#6B5E4E]">
        Username
        <input name="username" autoComplete="username" required className={field} defaultValue={state?.username} autoFocus={!state?.username} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] text-[#6B5E4E]">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} autoFocus={Boolean(state?.username)} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[14px] text-rose-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-[#2A2420] px-6 py-3 text-[16px] font-medium text-[#F8F2E7] transition hover:bg-black disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
