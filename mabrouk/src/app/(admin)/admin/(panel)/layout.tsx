import Link from "next/link";
import { logout } from "../actions";

/** Shell for every signed-in admin page. Access is enforced by src/proxy.ts and each page. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/invitations", label: "Invitations" },
    { href: "/admin", label: "Designs" },
    { href: "/admin/import", label: "Import" },
    { href: "/admin/media", label: "Music & images" },
  ];
  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-30 border-b border-[#E7DCC6] bg-[#F6F3EE]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link href="/admin" className="me-3 font-[family-name:var(--font-cormorant)] text-[22px] font-semibold">
            Mabrouk <span className="text-[#B08A45]">Admin</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-[14px]">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 rounded-full px-3 py-1.5 text-[#5E5246] hover:bg-white">
                {n.label}
              </Link>
            ))}
          </nav>
          <a href="/" target="_blank" className="hidden shrink-0 rounded-full px-3 py-1.5 text-[14px] text-[#5E5246] hover:bg-white sm:block">
            View site ↗
          </a>
          <form action={logout}>
            <button className="shrink-0 rounded-full border border-[#E1D5BE] px-3 py-1.5 text-[14px] hover:bg-white">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
