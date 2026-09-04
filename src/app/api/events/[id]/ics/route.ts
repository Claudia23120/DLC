import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data/events";
import { buildIcs, icsFilename } from "@/lib/calendar/ics";

/** Download a single event as an .ics file (Apple Calendar / most apps). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Requires a session; RLS also enforces read access.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const event = await getEvent(supabase, id);
  if (!event || !event.starts_at) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ics = buildIcs({
    uid: event.id,
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: event.starts_at,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename(event.title)}"`,
    },
  });
}
