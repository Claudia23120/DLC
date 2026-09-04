import type { ReactNode } from "react";

/** Centered, padded content column used inside the scroll region. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="page-content">
      <div className="page-content-inner">{children}</div>
    </div>
  );
}
