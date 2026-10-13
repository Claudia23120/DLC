"use client";

import { useState, useTransition } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Row, Stack } from "@/components/ui/Layout";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { saveShopItemAction, setShopItemActiveAction } from "@/app/(app)/junta/shop-actions";
import { centsToPriceInput, formatEuros } from "@/lib/domain/shop";
import { t } from "@/i18n/t";
import type { ShopAdminItem } from "@/lib/data/shop";
import { ActionBtn, StatusPill, rowTitleStyle } from "./parts";

interface VariantDraft {
  key: number; // stable React key for rows without a DB id yet
  id?: string;
  size: string;
  stock: string;
}

function ItemModal({ item, onClose }: { item: ShopAdminItem | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? centsToPriceInput(item.price_cents) : "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [allowBackorder, setAllowBackorder] = useState(item?.allow_backorder ?? true);
  const [variants, setVariants] = useState<VariantDraft[]>(
    item
      ? item.variants.map((v, i) => ({ key: i, id: v.id, size: v.size, stock: String(v.stock) }))
      : [{ key: 0, size: "", stock: "0" }],
  );
  const [nextKey, setNextKey] = useState(item ? item.variants.length : 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateVariant = (key: number, patch: Partial<VariantDraft>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await saveShopItemAction({
        id: item?.id,
        name,
        description,
        price,
        imageUrl,
        active,
        allowBackorder,
        variants: variants.map((v) => ({
          id: v.id,
          size: v.size,
          // An unparsable stock becomes NaN, which the server rejects with a clear message.
          stock: v.stock.trim() === "" ? NaN : Number(v.stock),
        })),
      });
      if (r.error) setError(r.error);
      else onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title={item ? t.shopAdmin.itemEditTitle : t.shopAdmin.itemNewTitle}>
      <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
        <Field label={t.shopAdmin.name} value={name} onChange={(e) => setName(e.target.value)} required style={{ height: 48 }} />
        <div className="field">
          <label>{t.shopAdmin.description}</label>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Field label={t.shopAdmin.price} value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="15,00" style={{ height: 48 }} />
        <Field label={t.shopAdmin.imageUrl} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" placeholder="https://…" style={{ height: 48 }} />
        <ToggleRow label={t.shopAdmin.active} checked={active} onChange={setActive} name="active" />
        <ToggleRow label={t.shopAdmin.allowBackorder} checked={allowBackorder} onChange={setAllowBackorder} name="allow_backorder" />

        <div className="field">
          <label>{t.shopAdmin.sizesAndStock}</label>
          <Stack gap={8}>
            {variants.map((v) => (
              <Row key={v.key} gap={8}>
                <Input
                  aria-label={t.shopAdmin.sizePlaceholder}
                  placeholder={t.shopAdmin.sizePlaceholder}
                  value={v.size}
                  onChange={(e) => updateVariant(v.key, { size: e.target.value })}
                  style={{ height: 44, flex: 1, minWidth: 0 }}
                />
                <Input
                  aria-label={t.shopAdmin.stock}
                  placeholder={t.shopAdmin.stock}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={v.stock}
                  onChange={(e) => updateVariant(v.key, { stock: e.target.value })}
                  style={{ height: 44, width: 90, flex: "none" }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm btn-danger"
                  onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}
                >
                  {t.shopAdmin.removeSize}
                </button>
              </Row>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setVariants((vs) => [...vs, { key: nextKey, size: "", stock: "0" }]);
                setNextKey((k) => k + 1);
              }}
            >
              {t.shopAdmin.addSize}
            </button>
          </Stack>
        </div>

        {error ? <div role="alert" style={{ color: "#dc2626", fontSize: 14 }}>{error}</div> : null}

        <ModalActions
          submitLabel={pending ? t.shopAdmin.saving : t.shopAdmin.save}
          pending={pending}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}

/** Catalogue management: create/edit items, sizes and stock, activate/deactivate. */
export function ShopCatalogAdmin({ items }: { items: ShopAdminItem[] }) {
  // `undefined` = closed, `null` = creating, item = editing. The modal is keyed so its form state resets.
  const [editing, setEditing] = useState<ShopAdminItem | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleActive = (item: ShopAdminItem) =>
    startTransition(async () => {
      const r = await setShopItemActiveAction(item.id, !item.active);
      setError(r.error ?? null);
    });

  return (
    <Stack gap={14}>
      <Row>
        <button type="button" className="btn btn-primary" style={{ height: 40, fontSize: 13 }} onClick={() => setEditing(null)}>
          {t.shopAdmin.newItem}
        </button>
      </Row>
      {error ? <div role="alert" style={{ color: "#dc2626", fontSize: 14 }}>{error}</div> : null}

      {items.length === 0 ? (
        <p className="text-muted">{t.shopAdmin.noItems}</p>
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          {items.map((item) => (
            <div key={item.id} className="admin-row" style={{ flexWrap: "wrap", opacity: item.active ? 1 : 0.6 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={rowTitleStyle}>{item.name}</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>{formatEuros(item.price_cents)}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                  {item.variants.map((v) => `${v.size}: ${v.stock}`).join(" · ")}
                </div>
              </div>
              <Row gap={6} style={{ flex: "none" }}>
                {item.allow_backorder ? <StatusPill label={t.shopAdmin.backorderOn} color="rgba(32,30,29,.55)" bg="rgba(32,30,29,.07)" /> : null}
                {!item.active ? <StatusPill label={t.shopAdmin.inactive} color="rgba(32,30,29,.55)" bg="rgba(32,30,29,.07)" /> : null}
                <ActionBtn onClick={() => setEditing(item)}>{t.shopAdmin.editItem}</ActionBtn>
                <ActionBtn disabled={pending} onClick={() => toggleActive(item)}>
                  {item.active ? t.shopAdmin.deactivate : t.shopAdmin.activate}
                </ActionBtn>
              </Row>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined ? (
        <ItemModal key={editing?.id ?? "new"} item={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </Stack>
  );
}
