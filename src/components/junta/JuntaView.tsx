"use client";

import { useState } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { Input } from "@/components/ui/Input";
import { Row } from "@/components/ui/Layout";
import { getEventAction } from "@/app/(app)/junta/actions";
import { CreateEventModal } from "@/components/bolos/CreateEventModal";
import { EditEventModal } from "@/components/bolos/EditEventModal";
import { CreateMemberModal } from "@/components/members/CreateMemberModal";
import { QuotaYearView, type QuotaRow } from "@/components/junta/QuotaYearView";
import { SongModal } from "@/components/junta/SongModal";
import { JuntaStatsBar } from "@/components/junta/JuntaStatsBar";
import { filterSortEvents } from "@/components/junta/eventLists";
import { BolosTab } from "@/components/junta/tabs/BolosTab";
import { MembresTab } from "@/components/junta/tabs/MembresTab";
import { ReunionsTab } from "@/components/junta/tabs/ReunionsTab";
import { VotacionsTab } from "@/components/junta/tabs/VotacionsTab";
import { MusicaTab } from "@/components/junta/tabs/MusicaTab";
import type { EventListItem, EventRow } from "@/lib/data/events";
import type { AdminMemberItem } from "@/lib/data/members";
import type { SongRow } from "@/lib/data/songs";
import { t } from "@/i18n/t";

type Tab = "bolos" | "membres" | "reunions" | "votacions" | "quotes" | "musica";

export interface JuntaStats {
  activeCount: number;
  inactiveCount: number;
  intermittentCount: number;
  quotaPaidCount: number;
  totalMembersForQuota: number;
  bolosThisYear: number;
  avgAttendance: number;
}

const BTN = { height: 40, fontSize: 13 } as const;

/** Thin shell: shared state (tab, search, modals) + tab bar; each tab lives in ./tabs. */
export function JuntaView({
  events, members, stats, quotaYear, quotaRows, songs,
}: {
  events: EventListItem[];
  members: AdminMemberItem[];
  stats: JuntaStats;
  quotaYear: number;
  quotaRows: QuotaRow[];
  songs: SongRow[];
}) {
  const [tab, setTab] = usePersistedState<Tab>("junta-tab", "bolos");
  const [search, setSearch] = usePersistedState("junta-search", "");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<SongRow | null>(null);

  async function handleEditEvent(id: string) {
    const full = await getEventAction(id);
    if (full) setEditingEvent(full);
  }

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSearch("");
  };

  const openSongModal = (song: SongRow | null) => {
    setEditingSong(song);
    setShowSongModal(true);
  };

  const q = search.toLowerCase();
  const bolos = filterSortEvents(events, "bolo", q);
  const reunions = filterSortEvents(events, "event", q);
  const votacions = filterSortEvents(events, "votacio", q);
  const filteredMembers = members.filter((m) =>
    !q || `${m.full_name} ${m.nickname ?? ""} ${m.email}`.toLowerCase().includes(q)
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "bolos", label: t.junta.tabBolos, count: bolos.length },
    { key: "membres", label: t.junta.tabMembres, count: members.length },
    { key: "reunions", label: t.junta.tabReunions, count: reunions.length },
    { key: "votacions", label: t.junta.tabVotacions, count: votacions.length },
    { key: "quotes", label: t.junta.tabQuotes, count: members.filter((m) => m.member_status !== "inactive").length },
    { key: "musica", label: t.songs.tabMusica, count: songs.length },
  ];

  return (
    <>
      <JuntaStatsBar stats={stats} />

      {/* Tab bar */}
      <div className="chip-row" style={{ marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            className="tab-pill"
            aria-pressed={tab === tb.key}
            onClick={() => handleTabChange(tb.key)}
          >
            {tb.label}
            <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.65 }}>{tb.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "quotes" && tab !== "musica" && (
        <Input
          placeholder={t.junta.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 44, marginBottom: 12 }}
        />
      )}

      {/* Create buttons */}
      <Row gap={8} wrap style={{ marginBottom: 16 }}>
        {(tab === "bolos" || tab === "reunions" || tab === "votacions") && (
          <button onClick={() => setShowCreateEvent(true)} className="btn btn-primary" style={BTN}>
            {t.junta.createBolo}
          </button>
        )}
        {tab === "membres" && (
          <>
            <button onClick={() => setShowCreateMember(true)} className="btn btn-primary" style={BTN}>
              {t.junta.createMember}
            </button>
            <a href="/api/admin/members/csv" download className="btn btn-secondary" style={{ ...BTN, display: "inline-flex", alignItems: "center" }}>
              {t.junta.exportCSV}
            </a>
          </>
        )}
        {tab === "musica" && (
          <button onClick={() => openSongModal(null)} className="btn btn-primary" style={BTN}>
            {t.songs.addSong}
          </button>
        )}
      </Row>

      {tab === "bolos" && <BolosTab bolos={bolos} resetKey={search} onEdit={handleEditEvent} />}
      {tab === "membres" && <MembresTab members={filteredMembers} resetKey={search} />}
      {tab === "reunions" && <ReunionsTab reunions={reunions} resetKey={search} onEdit={handleEditEvent} />}
      {tab === "votacions" && <VotacionsTab votacions={votacions} resetKey={search} onEdit={handleEditEvent} />}
      {tab === "musica" && <MusicaTab songs={songs} onEdit={openSongModal} />}
      {tab === "quotes" && (
        <QuotaYearView
          members={members}
          initialYear={quotaYear}
          initialRows={quotaRows}
        />
      )}

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <CreateMemberModal open={showCreateMember} onClose={() => setShowCreateMember(false)} />
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          open={true}
          onClose={() => setEditingEvent(null)}
        />
      )}
      <SongModal
        song={editingSong}
        open={showSongModal}
        onClose={() => { setShowSongModal(false); setEditingSong(null); }}
      />
    </>
  );
}
