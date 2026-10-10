/** Always-visible WhatsApp chat button (bottom corner), for customers who'd rather talk. */
export function FloatingWhatsApp({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="group fixed end-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex h-14 items-center gap-2 rounded-full bg-[#1f9d55] ps-4 pe-4 text-white shadow-[0_14px_30px_-10px_rgba(31,157,85,0.8)] transition hover:bg-[#1a8a4a] active:scale-95"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#1f9d55]/35 [animation-duration:2.6s]" aria-hidden />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
      </svg>
      <span className="hidden text-[14px] font-semibold sm:inline">{label}</span>
    </a>
  );
}
