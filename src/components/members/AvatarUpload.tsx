"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/(app)/perfil/actions";
import { t } from "@/i18n/t";

interface AvatarUploadProps {
  userId: string;
  name: string;
  currentUrl: string | null;
}

export function AvatarUpload({ userId, name, currentUrl }: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const supabase = createClient();
    const path = userId;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(t.auth.genericError);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    startTransition(async () => {
      const result = await updateAvatarUrl(publicUrl);
      if (result?.error) {
        setError(result.error);
      } else {
        setUrl(`${publicUrl}?t=${Date.now()}`);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          padding: 0,
          cursor: isPending ? "default" : "pointer",
          borderRadius: "50%",
        }}
        title={t.profile.changePhoto}
      >
        <Avatar name={name} url={url} size={88} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isPending ? 1 : 0,
            transition: "opacity .15s",
          }}
          className="avatar-overlay"
        >
          {isPending ? (
            <span style={{ color: "#fff", fontSize: 11, fontFamily: "var(--font-heading)" }}>…</span>
          ) : (
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </div>
      </button>
      <style>{`.avatar-overlay { pointer-events: none; } button:hover .avatar-overlay { opacity: 1 !important; }`}</style>
      <span style={{ fontSize: 12, opacity: 0.55 }}>{t.profile.changePhoto}</span>
      {error ? <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }}>{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
