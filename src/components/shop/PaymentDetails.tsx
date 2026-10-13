"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Row } from "@/components/ui/Layout";
import { CopyIcon } from "@/components/ui/icons";
import { formatEuros } from "@/lib/domain/shop";
import { t } from "@/i18n/t";
import type { ShopPaymentInfo } from "@/lib/data/shop";

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(copyValue ?? value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6 }}>{label}</div>
      <Row gap={8} style={{ background: "var(--color-bg)", borderRadius: 14, padding: "8px 12px" }}>
        <strong className="break-anywhere" style={{ fontSize: 14, flex: 1, minWidth: 0, fontFamily: "ui-monospace, monospace" }}>
          {value}
        </strong>
        <button
          type="button"
          className="btn btn-icon"
          onClick={copy}
          title={t.shop.copy}
          style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)", flex: "none" }}
        >
          <CopyIcon size={16} />
        </button>
      </Row>
      {copied ? <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{t.shop.copied}</div> : null}
    </div>
  );
}

/** Bank-transfer instructions: amount, IBAN and the order's unique concept. */
export function PaymentDetails({
  payment,
  concept,
  amountCents,
}: {
  payment: ShopPaymentInfo;
  concept: string;
  amountCents: number;
}) {
  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{t.shop.payByTransfer}</div>
      <div>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{t.shop.amountToPay}: </span>
        <strong style={{ fontSize: 18 }}>{formatEuros(amountCents)}</strong>
      </div>
      <CopyRow label={t.shop.iban} value={payment.iban} copyValue={payment.iban.replace(/\s/g, "")} />
      <CopyRow label={t.shop.concept} value={concept} />
      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{t.shop.conceptNote}</p>
    </Card>
  );
}
