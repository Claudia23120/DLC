"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { createSongAction, updateSongAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";
import type { SongRow } from "@/lib/data/songs";

function toSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function SongModal({
  song,
  open,
  onClose,
}: {
  song?: SongRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const isEdit = !!song;
  const [title, setTitle] = useState(song?.title ?? "");
  const [slug, setSlug] = useState(song?.slug ?? "");
  const [kind, setKind] = useState(song?.kind ?? "");
  const [tempo, setTempo] = useState(song?.tempo?.toString() ?? "");
  const [notes, setNotes] = useState(song?.notes ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEdit) setSlug(toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) { setError("Cal un títol i un identificador."); return; }
    setPending(true);
    setError(null);

    let gpUrl = song?.gp_url ?? null;

    if (file) {
      const supabase = createClient();
      const path = `${slug}.gp`;
      const { error: uploadError } = await supabase.storage
        .from("songs")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setPending(false);
        return;
      }
      const { data } = supabase.storage.from("songs").getPublicUrl(path);
      gpUrl = data.publicUrl;
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("slug", slug.trim());
    fd.set("kind", kind.trim());
    fd.set("gp_url", gpUrl ?? "");
    fd.set("tempo", tempo);
    fd.set("notes", notes.trim());

    const result = isEdit
      ? await updateSongAction(song.id, fd)
      : await createSongAction(fd);

    if (result?.error) { setError(result.error); setPending(false); }
    else {
      setPending(false);
      if (!isEdit) {
        setTitle(""); setSlug(""); setKind(""); setTempo(""); setNotes(""); setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t.songs.editSong : t.songs.addSong}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field
          label={t.create.title}
          name="title"
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          style={{ height: 48 }}
        />
        <Field
          label={t.songs.slug}
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{ height: 48 }}
          placeholder="matador"
        />
        <Field
          label={t.create.affects.replace("A qui afecta", "Tipus")}
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          style={{ height: 48 }}
          placeholder="Tema de sortida"
        />
        <Field
          label={t.songs.tempo}
          name="tempo"
          type="number"
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          style={{ height: 48 }}
          placeholder="104"
        />
        <Field
          label={t.songs.notes}
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ height: 48 }}
          placeholder="Notes internes per a la junta"
        />

        {/* GP file upload */}
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
            {t.songs.gpFile}
          </div>
          {song?.gp_url && !file && (
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
              ✓ Ja té partitura pujada. Selecciona un fitxer per substituir-la.
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".gp,.gp3,.gp4,.gp5,.gpx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 13, width: "100%" }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
          {pending ? t.common.loading : t.songs.saveSong}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose} style={{ height: 44 }}>
          {t.common.cancel}
        </button>
      </form>
    </Modal>
  );
}
