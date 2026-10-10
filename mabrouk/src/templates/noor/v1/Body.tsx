"use client";

import type { ReactNode } from "react";
import { shows, type InvitationView } from "@/lib/view";
import { Contacts, CouplePhotos, Notes, ShareInvite, Timeline, useLightbox, VenueShowcase } from "./Extras";
import { Rsvp } from "./Rsvp";
import { Countdown, Details, Events, Footer, Gallery, Story } from "./Sections";

/**
 * Everything below the hero, in one order for every template. Each section
 * renders only when it's switched on and has content, so turning things off
 * in the admin never leaves holes in the page.
 */
export function InvitationSections({
  view,
  heroShowsCouplePhoto = true,
  children,
}: {
  view: InvitationView;
  /** Noor puts the first couple photo in the hero arch; Farah doesn't. */
  heroShowsCouplePhoto?: boolean;
  children?: ReactNode;
}) {
  const { open, node } = useLightbox();
  const coupleView =
    !heroShowsCouplePhoto && view.couple?.layout === "arch" ? { ...view, couple: { ...view.couple, layout: "filmstrip" as const } } : view;
  return (
    <>
      {shows(view, "countdown") && <Countdown startsAt={view.main.startsAt} title={view.countdown?.title} showSeconds={view.countdown?.showSeconds ?? true} />}
      <CouplePhotos view={coupleView} />
      <Story view={view} />
      <Events view={view} />
      <Timeline view={view} />
      <VenueShowcase view={view} />
      <Details view={view} />
      <Gallery view={view} onOpen={open} />
      <Rsvp view={view} />
      <Notes view={view} />
      <Contacts view={view} />
      <ShareInvite view={view} />
      {children}
      <Footer view={view} />
      {node}
    </>
  );
}
