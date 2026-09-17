/**
 * Foc configuration ("full de foc") for a bolo. This is a CLIENT-ONLY document:
 * it is never persisted to the database. The junta fills it in on the bolo
 * detail page to generate/print the sheet they used to send as an Excel. The
 * only persistence is the editing browser's localStorage, so work isn't lost
 * on a reload — it is not shared with other members.
 *
 * The structure mirrors the printed sheet: title, Llucifer / Diablessa,
 * cremadors, a task matrix over N trams, N encesses (lluïments) and material
 * responsables. Everything variable is a plain array so the editor can add or
 * remove rows freely.
 */

/** A single task row (e.g. "Fogall") with one value per tram, keyed by tram id. */
export interface FocTramCell {
  [tramId: string]: string;
}

export interface FocTram {
  id: string;
  name: string; // "Tram 1 - Pl. Comas fins C/ Joan Gamper…"
}

export interface FocTaskRow {
  id: string;
  label: string; // "Fogall", "Carro", "Repartidors Piro"…
  cells: FocTramCell; // tram id → assignment (member name or free text)
}

export interface FocEncesa {
  id: string;
  name: string; // "Encesa Final"
  lloc: string; // "Pl. Concòrdia"
  participants: string[]; // member names or free text
}

export interface FocConfig {
  title: string;
  llucifer: string;
  diablessa: string;
  cremadors: string[];
  trams: FocTram[];
  tasks: FocTaskRow[];
  encesses: FocEncesa[];
  responsablesMaterial: string[];
}

/** Stable id for a new tram / task / encesa (client-side only). */
export function focUid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

/** The default task rows of a fire sheet, matching the current Excel. */
const DEFAULT_TASK_LABELS = ["Fogall", "Carro", "Repartidors Piro"];

/**
 * A blank config for a bolo, pre-seeded like the paper sheet (2 trams).
 * `cremadors` is pre-filled with everyone signed up as a diable; the junta then
 * adds tabalers or free text on top.
 */
export function defaultFocConfig(title: string, cremadors: string[] = []): FocConfig {
  const trams: FocTram[] = [
    { id: focUid(), name: "Tram 1" },
    { id: focUid(), name: "Tram 2" },
  ];
  return {
    title: title || "Correfoc",
    llucifer: "",
    diablessa: "",
    cremadors: [...cremadors],
    trams,
    tasks: DEFAULT_TASK_LABELS.map((label) => ({ id: focUid(), label, cells: {} })),
    encesses: [],
    responsablesMaterial: [],
  };
}

/** localStorage key for a bolo's in-progress fire sheet. */
export function focStorageKey(eventId: string): string {
  return `foc-config:${eventId}`;
}
