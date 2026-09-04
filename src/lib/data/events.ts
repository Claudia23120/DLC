import "server-only";
import type { Database, EventKind, BoloResponse } from "@/types/database";
import type { EventCounts } from "@/lib/domain/events";
import type { createClient } from "@/lib/supabase/server";

// The exact typed client returned by our server helper (keeps generics aligned).
type DB = Awaited<ReturnType<typeof createClient>>;

export type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface EventListItem extends EventRow {
  counts: EventCounts;
  myResponse: BoloResponse | null; // for bolos
}

const EMPTY_COUNTS = (id: string): EventCounts => ({
  event_id: id,
  signup_count: 0,
  confirmed_count: 0,
  vote_count: 0,
});

/** All events with per-event counts and the current member's bolo response. */
export async function listEvents(supabase: DB, userId: string): Promise<EventListItem[]> {
  const [{ data: events }, { data: counts }, { data: mine }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("event_counts").select("*"),
    supabase.from("bolo_attendance").select("event_id, response").eq("member_id", userId),
  ]);

  const countsById = new Map<string, EventCounts>(
    (counts ?? []).map((c) => [c.event_id as string, c as EventCounts]),
  );
  const responseById = new Map<string, BoloResponse>(
    (mine ?? []).map((m) => [m.event_id, m.response as BoloResponse]),
  );

  return (events ?? []).map((e) => ({
    ...e,
    counts: countsById.get(e.id) ?? EMPTY_COUNTS(e.id),
    myResponse: responseById.get(e.id) ?? null,
  }));
}

/** A single event row, or null. */
export async function getEvent(supabase: DB, id: string): Promise<EventRow | null> {
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  return data;
}

export interface Signup {
  member_id: string;
  response: BoloResponse;
  brings_car: boolean;
  car_seats: number | null;
  needs: string[];
  full_name: string;
  nickname: string | null;
}

/** Everyone who has responded to a bolo, with their profile basics. */
export async function getBoloSignups(supabase: DB, eventId: string): Promise<Signup[]> {
  const { data } = await supabase
    .from("bolo_attendance")
    .select("member_id, response, brings_car, car_seats, needs, profiles!inner(full_name, nickname)")
    .eq("event_id", eventId);

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string; nickname: string | null };
    return {
      member_id: row.member_id,
      response: row.response as BoloResponse,
      brings_car: row.brings_car,
      car_seats: row.car_seats,
      needs: row.needs ?? [],
      full_name: profile.full_name,
      nickname: profile.nickname,
    };
  });
}

/** The current member's response to a bolo, or null. */
export async function getMyBoloResponse(
  supabase: DB,
  eventId: string,
  userId: string,
): Promise<{ response: BoloResponse; brings_car: boolean } | null> {
  const { data } = await supabase
    .from("bolo_attendance")
    .select("response, brings_car")
    .eq("event_id", eventId)
    .eq("member_id", userId)
    .maybeSingle();
  return data ? { response: data.response as BoloResponse, brings_car: data.brings_car } : null;
}

export interface CommentItem {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
}

/** Comments on an event (bolo, meeting or poll), oldest first. */
export async function getComments(supabase: DB, eventId: string): Promise<CommentItem[]> {
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, profiles(full_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string } | null;
    return {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      author_name: profile?.full_name ?? "—",
    };
  });
}

export interface CreateEventInput {
  kind: EventKind;
  title: string;
  startsAt: string | null;
  location?: string | null;
  organizer?: string | null;
  description?: string | null;
  placeNote?: string | null;
  mapUrl?: string | null;
  askCars?: boolean;
  askSizes?: boolean;
  allowedRoles?: ("diable" | "tabaler" | "supporter")[];
  agenda?: string | null;
  affects?: string | null;
  closesAt?: string | null;
  pollOptions?: string[];
  createdBy: string;
}

/** Insert an event (+ poll options for a votació) and return the new row. */
export async function createEvent(supabase: DB, input: CreateEventInput): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      kind: input.kind,
      title: input.title,
      starts_at: input.startsAt,
      location: input.location ?? null,
      organizer: input.organizer ?? null,
      description: input.description ?? null,
      place_note: input.placeNote ?? null,
      map_url: input.mapUrl ?? null,
      ask_cars: input.askCars ?? true,
      ask_sizes: input.askSizes ?? true,
      allowed_roles: input.allowedRoles ?? ["diable", "tabaler", "supporter"],
      agenda: input.agenda ?? null,
      affects: input.affects ?? null,
      closes_at: input.closesAt ?? null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No s'ha pogut crear l'esdeveniment");
  }

  if (input.kind === "votacio" && input.pollOptions?.length) {
    const rows = input.pollOptions
      .map((label, position) => ({ event_id: data.id, label: label.trim(), position }))
      .filter((r) => r.label.length > 0);
    if (rows.length) {
      await supabase.from("poll_options").insert(rows);
    }
  }

  return data;
}
