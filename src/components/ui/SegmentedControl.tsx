"use client";

type Tone = "red" | "sage" | "ink" | "mute";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: Tone;
  className?: string;
}

/** Row of pill tabs, as used for Llista/Calendari/Històric etc. (styles in globals.css) */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = "red",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={className ? `segmented ${className}` : "segmented"} data-tone={tone}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="segment"
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
