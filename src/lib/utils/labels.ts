import { t } from "@/i18n/t";
import type { BoardPosition } from "@/types/database";

/** Human label for a board position, or the generic "member" label. */
export function boardPositionLabel(position: BoardPosition | null): string {
  if (!position) return "Membre";
  return t.boardPositions[position];
}
