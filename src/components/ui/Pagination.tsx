import { Row } from "./Layout";

export function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <Row gap={12} justify="center" style={{ padding: "8px 0 4px" }}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="btn btn-secondary btn-sm"
        style={{ height: 34, padding: "0 14px", fontSize: 13, opacity: hasPrev ? 1 : 0.35 }}
      >
        ← Anterior
      </button>
      <span style={{ fontSize: 13, opacity: 0.55, minWidth: 60, textAlign: "center" }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="btn btn-secondary btn-sm"
        style={{ height: 34, padding: "0 14px", fontSize: 13, opacity: hasNext ? 1 : 0.35 }}
      >
        Següent →
      </button>
    </Row>
  );
}
