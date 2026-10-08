import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[radial-gradient(120%_80%_at_50%_0%,#FFFBF4,#EFE4D0)] px-5">
      <div className="w-full max-w-sm rounded-3xl border border-[#E7DCC6] bg-white/85 p-8 shadow-[0_30px_60px_-30px_rgba(58,46,34,0.45)] backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-[13px] tracking-[0.25em] text-[#B08A45] uppercase">Mabrouk · مبروك</p>
          <h1 className="mt-2 font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Admin sign in</h1>
        </div>
        <Suspense>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
