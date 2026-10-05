"use client";

import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { deleteSongAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";
import type { SongRow } from "@/lib/data/songs";
import { ActionBtn, DangerBtn, ListCard, rowTitleStyle } from "./parts";
import { Row } from "@/components/ui/Layout";

function SongListRow({ song, onEdit }: { song: SongRow; onEdit: () => void }) {
  return (
    <div className="admin-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rowTitleStyle}>{song.title}</div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{song.kind ?? "—"}</div>
      </div>
      <Row gap={6} style={{ flex: "none" }}>
        {song.gp_url
          ? <span style={{ fontSize: 11, opacity: 0.7 }}>🎼 {t.songs.hasScore}</span>
          : <span style={{ fontSize: 11, opacity: 0.4 }}>{t.songs.noScore}</span>
        }
        <ActionBtn onClick={onEdit}>{t.songs.editSong}</ActionBtn>
        <DangerBtn
          label={t.songs.deleteSong}
          confirmText={t.songs.deleteConfirm}
          onConfirm={() => deleteSongAction(song.id)}
        />
      </Row>
    </div>
  );
}

export function MusicaTab({ songs, onEdit }: { songs: SongRow[]; onEdit: (song: SongRow) => void }) {
  const pag = usePagination(songs, 20, "musica");
  return (
    <>
      <ListCard empty={songs.length === 0} emptyText={t.songs.noSongs}>
        {pag.pageItems.map((song) => (
          <SongListRow key={song.id} song={song} onEdit={() => onEdit(song)} />
        ))}
      </ListCard>
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </>
  );
}
