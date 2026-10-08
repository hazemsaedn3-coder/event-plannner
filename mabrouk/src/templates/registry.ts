import type { ComponentType } from "react";
import type { L10n, TemplateId, ThemeId } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import NoorV1 from "./noor/v1/NoorInvitation";
import { noorThemes as noorV1Themes, type NoorTheme } from "./noor/v1/themes";

/**
 * Template registry.
 *
 * Invitations pin { templateId, templateVersion }. To improve a template
 * without touching published invitations, copy `noor/v1` to `noor/v2`,
 * change v2, register it below and bump `latest`. New orders use `latest`;
 * existing invitations keep rendering the version they were published with.
 * Never edit a released version in a way that changes how it looks.
 */
export interface TemplateVersion {
  Component: ComponentType<{ view: InvitationView }>;
  themes: Record<ThemeId, NoorTheme>;
}

export interface TemplateEntry {
  name: L10n;
  latest: number;
  versions: Record<number, TemplateVersion>;
}

export const templates: Record<TemplateId, TemplateEntry> = {
  noor: {
    name: { ar: "نور", en: "Noor" },
    latest: 1,
    versions: {
      1: { Component: NoorV1, themes: noorV1Themes },
    },
  },
};

export function resolveTemplate(id: TemplateId, version: number): TemplateVersion {
  const entry = templates[id];
  const resolved = entry?.versions[version];
  if (!resolved) throw new Error(`Unknown template ${id}@${version}`);
  return resolved;
}
