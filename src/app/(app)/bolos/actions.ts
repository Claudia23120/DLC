"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createEvent } from "@/lib/data/events";
import { notifyNewEvent } from "@/lib/email/notify";
import { sendEmail } from "@/lib/email/resend";
import { madridDateTimeToISO } from "@/lib/utils/dates";
import { eventDetailHref } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { BoloResponse, EventKind, MemberRole } from "@/types/database";

/** Set (or change) the current member's response to a bolo. */
export async function setBoloAttendance(
  eventId: string,
  response: BoloResponse,
  bringsCar: boolean,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("sizes")
    .eq("id", user.id)
    .single();

  await supabase.from("bolo_attendance").upsert(
    {
      event_id: eventId,
      member_id: user.id,
      response,
      brings_car: response === "no" ? false : bringsCar,
      size_snapshot: response === "no" ? null : (profile?.sizes ?? null),
    },
    { onConflict: "event_id,member_id" },
  );

  revalidatePath(`/bolos/${eventId}`);
  revalidatePath("/bolos");
}

/** Post a comment on an event (bolo, meeting or poll). */
export async function addComment(eventId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("comments").insert({ event_id: eventId, member_id: user.id, body: text });

  // Revalidate whichever detail route this event lives on.
  const { data: event } = await supabase.from("events").select("kind").eq("id", eventId).single();
  if (event) revalidatePath(eventDetailHref(eventId, event.kind));
}

export interface CreateEventState {
  error?: string;
}

/** Admin: create a bolo / reunió / votació, then notify all members. */
export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.genericError };

  // Guarded by RLS too, but fail fast for a clear message.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { error: t.auth.genericError };

  const kind = String(formData.get("kind") ?? "bolo") as EventKind;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Cal un títol." };

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const startsAt = madridDateTimeToISO(date, time);

  let newId: string;
  try {
    if (kind === "bolo") {
      const roles = (["diable", "tabaler", "supporter"] as MemberRole[]).filter(
        (r) => formData.get(`role_${r}`) === "on",
      );
      const event = await createEvent(supabase, {
        kind,
        title,
        startsAt,
        location: String(formData.get("location") ?? "") || null,
        placeNote: String(formData.get("place_note") ?? "") || null,
        organizer: String(formData.get("organizer") ?? "") || null,
        description: String(formData.get("description") ?? "") || null,
        mapUrl: String(formData.get("map_url") ?? "") || null,
        askCars: formData.get("ask_cars") === "on",
        askSizes: formData.get("ask_sizes") === "on",
        allowedRoles: roles.length ? roles : ["diable", "tabaler", "supporter"],
        createdBy: user.id,
      });
      newId = event.id;
    } else if (kind === "reunio") {
      const event = await createEvent(supabase, {
        kind,
        title,
        startsAt,
        location: String(formData.get("location") ?? "") || null,
        agenda: String(formData.get("agenda") ?? "") || null,
        affects: String(formData.get("affects") ?? "") || null,
        createdBy: user.id,
      });
      newId = event.id;
    } else {
      const options = formData.getAll("option").map(String).filter((o) => o.trim());
      const closes = String(formData.get("closes_at") ?? "");
      const event = await createEvent(supabase, {
        kind,
        title,
        startsAt: null,
        closesAt: closes ? new Date(closes).toISOString() : null,
        pollOptions: options,
        createdBy: user.id,
      });
      newId = event.id;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : t.auth.genericError };
  }

  // Fire-and-forget notification (safe no-op when emails are disabled).
  await notifyNewEvent({ kind, title, eventId: newId, creatorEmail: profile.email ?? undefined });

  revalidatePath("/bolos");
  redirect(eventDetailHref(newId, kind));
}

/** Admin: set any member's attendance (or remove it with response=null). */
export async function adminSetBoloAttendance(
  eventId: string,
  memberId: string,
  response: BoloResponse | null,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return;

  if (response === null) {
    await supabase.from("bolo_attendance").delete()
      .eq("event_id", eventId).eq("member_id", memberId);
  } else {
    await supabase.from("bolo_attendance").upsert(
      { event_id: eventId, member_id: memberId, response, brings_car: false },
      { onConflict: "event_id,member_id" },
    );
  }
  revalidatePath(`/bolos/${eventId}`);
}

/** Admin: email members who have not yet responded to a bolo. */
export async function remindPending(eventId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return;

  const { data: event } = await supabase.from("events").select("title").eq("id", eventId).single();
  if (!event) return;

  // Members with no response yet (service role: read full roster + responses).
  const admin = createServiceRoleClient();
  const [{ data: members }, { data: responded }] = await Promise.all([
    admin.from("profiles").select("email"),
    admin.from("bolo_attendance").select("member_id, profiles!inner(email)").eq("event_id", eventId),
  ]);

  const respondedEmails = new Set(
    (responded ?? []).map((r) => (r.profiles as unknown as { email: string }).email),
  );
  const pending = (members ?? [])
    .map((m) => m.email)
    .filter((e): e is string => Boolean(e) && !respondedEmails.has(e));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendEmail({
    to: pending,
    subject: t.emails.remindSubject(event.title),
    html: `<p>${t.emails.greeting}</p><p>${t.emails.remindBody}</p><p><a href="${siteUrl}/bolos/${eventId}">${t.emails.cta}</a></p>`,
    text: `${t.emails.greeting}\n${t.emails.remindBody}\n${siteUrl}/bolos/${eventId}`,
  });

  revalidatePath(`/bolos/${eventId}`);
}
