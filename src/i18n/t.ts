import { ca } from "./ca";

/**
 * The app ships in a single language (Catalan), so `t` is simply the message
 * catalog. Kept as a named export (and re-export of the type) so that swapping
 * in a real i18n library later — or adding a second locale — is a local change.
 *
 * Usage:  import { t } from "@/i18n/t";  t.bolos.title
 */
export const t = ca;

export type { Messages } from "./ca";
