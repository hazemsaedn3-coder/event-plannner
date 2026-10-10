import { LivePreviewClient } from "@/components/admin/LivePreviewClient";

/** Frame used by the editor's real-time preview (admin only; see src/proxy.ts). */
export default function LivePreviewPage() {
  return <LivePreviewClient />;
}
