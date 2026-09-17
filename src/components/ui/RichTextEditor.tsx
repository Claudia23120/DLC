"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";

const COLORS = [
  { label: "Negre",  value: null,          bg: "#201e1d" },
  { label: "Vermell", value: "#c62f28",    bg: "#c62f28" },
  { label: "Verd",   value: "#4f5939",     bg: "#4f5939" },
  { label: "Marró",  value: "#6f634b",     bg: "#6f634b" },
];

interface Props {
  name: string;
  defaultValue?: string;
  label?: string;
}

export function RichTextEditor({ name, defaultValue = "", label }: Props) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const active = (type: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(type, attrs) ?? false;

  const btn = (onClick: () => void, isActive: boolean, children: React.ReactNode, title: string) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 6, cursor: "pointer",
        fontSize: 13, fontWeight: 600,
        border: "1px solid",
        borderColor: isActive ? "var(--color-accent-500)" : "rgba(32,30,29,.2)",
        background: isActive ? "var(--color-accent-100)" : "var(--color-surface)",
        color: isActive ? "var(--color-accent-800)" : "var(--color-text)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      {label ? (
        <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
          {label}
        </div>
      ) : null}

      <div style={{ border: "1px solid rgba(32,30,29,.22)", borderRadius: 14, overflow: "hidden", background: "var(--color-surface)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: "1px solid rgba(32,30,29,.12)", flexWrap: "wrap", alignItems: "center" }}>
          {btn(() => editor?.chain().focus().toggleBold().run(), active("bold"), <b>B</b>, "Negreta")}
          {btn(() => editor?.chain().focus().toggleItalic().run(), active("italic"), <i>I</i>, "Cursiva")}
          {btn(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active("heading", { level: 2 }), "H2", "Títol")}
          {btn(() => editor?.chain().focus().toggleBulletList().run(), active("bulletList"), "•", "Llista")}
          {btn(() => editor?.chain().focus().toggleOrderedList().run(), active("orderedList"), "1.", "Llista numerada")}

          <div style={{ width: 1, height: 20, background: "rgba(32,30,29,.15)", margin: "0 2px" }} />

          {COLORS.map((c) => {
            const isActive = c.value
              ? active("textStyle", { color: c.value })
              : !editor?.getAttributes("textStyle").color;
            return (
              <button
                key={c.label}
                type="button"
                title={c.label}
                onClick={() =>
                  c.value
                    ? editor?.chain().focus().setColor(c.value).run()
                    : editor?.chain().focus().unsetColor().run()
                }
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: c.bg, cursor: "pointer",
                  border: isActive ? "2px solid var(--color-text)" : "2px solid transparent",
                  outline: isActive ? "2px solid rgba(32,30,29,.3)" : "none",
                  outlineOffset: 1,
                }}
              />
            );
          })}
        </div>

        {/* Editor area */}
        <div className="rich-editor">
          <EditorContent editor={editor} />
        </div>
      </div>

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
