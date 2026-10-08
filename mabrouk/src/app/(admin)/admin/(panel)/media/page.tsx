import { Suspense } from "react";
import { getCatalogStore } from "@/catalog/store";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { CopyLink } from "@/components/invite/CopyLink";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteMedia } from "../../actions";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

async function MediaLibrary() {
  await requireAdmin();
  const media = await getCatalogStore().listMedia();
  const audio = media.filter((m) => m.kind === "audio");
  const images = media.filter((m) => m.kind === "image");

  return (
    <>
      <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] leading-tight">Music & images</h1>
      <p className="text-[14px] text-[#7A6A55]">
        Upload background music (MP3/M4A, royalty-free only) and images (JPG/PNG/WebP). Max 4 MB per file. Then pick them in each template.
      </p>
      <div className="mt-5">
        <MediaUploader />
      </div>

      <section className="mt-8">
        <h2 className="text-[18px] font-semibold">Music tracks ({audio.length})</h2>
        <p className="text-[13px] text-[#7A6A55]">The built-in “Mabrouk Music Box” is always available and needs no upload.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {audio.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E7DCC6] bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="text-[12px] text-[#7A6A55]">
                  {m.mime} · {kb(m.size)}
                </p>
              </div>
              <audio controls preload="none" src={`/media/${m.id}`} className="h-10 max-w-full" />
              <ConfirmButton action={deleteMedia.bind(null, m.id)} message={`Delete “${m.name}”? Templates using it will skip it.`}>
                Delete
              </ConfirmButton>
            </li>
          ))}
          {!audio.length && <li className="text-[14px] text-[#A0907A]">No tracks uploaded yet.</li>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] font-semibold">Images ({images.length})</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-[#E7DCC6] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${m.id}`} alt={m.name} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="flex flex-col gap-2 p-2">
                <p className="truncate text-[12px]">{m.name}</p>
                <div className="flex flex-wrap gap-1 text-[12px]">
                  <CopyLink value={`/media/${m.id}`} label="Copy URL" done="Copied" />
                  <ConfirmButton action={deleteMedia.bind(null, m.id)} message={`Delete “${m.name}”?`}>
                    ✕
                  </ConfirmButton>
                </div>
              </div>
            </li>
          ))}
          {!images.length && <li className="col-span-full text-[14px] text-[#A0907A]">No images uploaded yet.</li>}
        </ul>
      </section>
    </>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<p className="text-[#7A6A55]">Loading…</p>}>
      <MediaLibrary />
    </Suspense>
  );
}
