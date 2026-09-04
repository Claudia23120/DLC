"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Track color when on (defaults to sage green, as in the design). */
  onColor?: string;
  label?: string;
  disabled?: boolean;
}

/** Pill switch matching the toggle used across the prototype. */
export function Toggle({
  checked,
  onChange,
  onColor = "var(--color-sage-500)",
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 52,
        height: 30,
        flex: "none",
        border: 0,
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 999,
        background: checked ? onColor : "rgba(32,30,29,.18)",
        position: "relative",
        transition: "background .2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
          transition: "left .2s",
        }}
      />
    </button>
  );
}
