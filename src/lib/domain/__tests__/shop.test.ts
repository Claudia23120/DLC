import { describe, expect, it } from "vitest";
import {
  amountDueCents,
  backorderedUnits,
  cartTotals,
  coveredCents,
  pendingCents,
  canMarkDelivered,
  compareSizes,
  pendingRestock,
  splitByStock,
  debtByMember,
  deliveredPatch,
  formatEuros,
  isClosed,
  matchesOrderFilter,
  matchesOrderSearch,
  centsToPriceInput,
  parsePriceToCents,
  validateVariants,
  orderReference,
  orderTotal,
  pendingPatch,
  totalPending,
  transferConcept,
  unpaidPatch,
  validateCart,
  type OrderState,
} from "../shop";

const NOW = new Date("2026-10-13T10:00:00.000Z");

describe("references", () => {
  it("pads the order number to 4 digits", () => {
    expect(orderReference(42)).toBe("DIABLES-0042");
    expect(orderReference(1)).toBe("DIABLES-0001");
    expect(orderReference(12345)).toBe("DIABLES-12345");
  });

  it("builds the transfer concept with the member name", () => {
    expect(transferConcept(42, "  Anna   Puig ")).toBe("DIABLES-0042 Anna Puig");
    expect(transferConcept(7, "  ")).toBe("DIABLES-0007");
  });

  it("formats euros", () => {
    expect(formatEuros(1500).replace(/\s/g, " ")).toBe("15,00 €");
    expect(formatEuros(0).replace(/\s/g, " ")).toBe("0,00 €");
  });
});

describe("orderTotal", () => {
  it("sums quantity × unit price", () => {
    expect(
      orderTotal([
        { quantity: 2, unitPriceCents: 1500 },
        { quantity: 1, unitPriceCents: 2250 },
      ]),
    ).toBe(5250);
  });

  it("is 0 for an empty cart", () => {
    expect(orderTotal([])).toBe(0);
  });
});

describe("validateCart", () => {
  const stock = {
    a: { stock: 3, allowBackorder: false },
    b: { stock: 0, allowBackorder: false },
    c: { stock: 1, allowBackorder: true },
  };

  it("accepts a cart within stock", () => {
    expect(validateCart([{ variantId: "a", quantity: 3 }], stock)).toEqual([]);
  });

  it("rejects an empty cart", () => {
    expect(validateCart([], stock)).toEqual([{ code: "empty" }]);
  });

  it("rejects non-positive, fractional and oversized quantities", () => {
    for (const quantity of [0, -1, 1.5, 100]) {
      expect(validateCart([{ variantId: "a", quantity }], stock)).toEqual([
        { code: "invalid_quantity", variantId: "a" },
      ]);
    }
  });

  it("rejects more than the stock when the item does not allow backorders", () => {
    expect(validateCart([{ variantId: "a", quantity: 4 }], stock)).toEqual([
      { code: "insufficient_stock", variantId: "a", available: 3 },
    ]);
    expect(validateCart([{ variantId: "b", quantity: 1 }], stock)).toEqual([
      { code: "insufficient_stock", variantId: "b", available: 0 },
    ]);
  });

  it("accepts more than the stock (even none) when the item allows backorders", () => {
    expect(validateCart([{ variantId: "c", quantity: 5 }], stock)).toEqual([]);
    expect(validateCart([{ variantId: "c", quantity: 5 }], { c: { stock: 0, allowBackorder: true } })).toEqual([]);
  });

  it("still enforces the per-line maximum with backorders", () => {
    expect(validateCart([{ variantId: "c", quantity: 100 }], stock)).toEqual([
      { code: "invalid_quantity", variantId: "c" },
    ]);
  });

  it("sums repeated lines of the same variant before checking stock", () => {
    expect(
      validateCart(
        [
          { variantId: "a", quantity: 2 },
          { variantId: "a", quantity: 2 },
        ],
        stock,
      ),
    ).toEqual([{ code: "insufficient_stock", variantId: "a", available: 3 }]);
  });

  it("rejects unknown variants", () => {
    expect(validateCart([{ variantId: "zzz", quantity: 1 }], stock)).toEqual([
      { code: "unknown_variant", variantId: "zzz" },
    ]);
  });
});

describe("backorders", () => {
  it("splits a line into reserved units and units pending restock", () => {
    expect(splitByStock(3, 5)).toEqual({ reserved: 3, backordered: 0 });
    expect(splitByStock(3, 1)).toEqual({ reserved: 1, backordered: 2 });
    expect(splitByStock(3, 0)).toEqual({ reserved: 0, backordered: 3 });
    expect(splitByStock(2, -1)).toEqual({ reserved: 0, backordered: 2 });
  });

  it("an order can be delivered only when no line is pending restock", () => {
    expect(canMarkDelivered([{ backorderedQuantity: 0 }, { backorderedQuantity: 0 }])).toBe(true);
    expect(canMarkDelivered([{ backorderedQuantity: 0 }, { backorderedQuantity: 2 }])).toBe(false);
    expect(canMarkDelivered([])).toBe(true);
  });

  it("totals what the board still has to get, per variant", () => {
    const lines = [
      { variantId: "a", backorderedQuantity: 2 },
      { variantId: "a", backorderedQuantity: 1 },
      { variantId: "b", backorderedQuantity: 0 },
      { variantId: "c", backorderedQuantity: 4 },
    ];
    expect(Object.fromEntries(pendingRestock(lines))).toEqual({ a: 3, c: 4 });
    expect(backorderedUnits(lines)).toBe(7);
    expect(pendingRestock([]).size).toBe(0);
  });
});

describe("state transitions", () => {
  it("marks delivered with the date, and can be undone", () => {
    expect(deliveredPatch(NOW)).toEqual({
      delivery_status: "delivered",
      delivered_at: "2026-10-13T10:00:00.000Z",
    });
    expect(pendingPatch()).toEqual({ delivery_status: "pending", delivered_at: null });
  });

  it("undoing a payment clears the amount, date and method", () => {
    expect(unpaidPatch()).toEqual({
      payment_status: "unpaid",
      paid_cents: 0,
      paid_at: null,
      payment_method: null,
    });
  });

  it("keeps the two states independent", () => {
    const takenUnpaid: OrderState = { delivery_status: "delivered", payment_status: "unpaid", due_cents: 500 };
    const paidNotCollected: OrderState = { delivery_status: "pending", payment_status: "paid", due_cents: 0 };
    expect(isClosed(takenUnpaid)).toBe(false);
    expect(isClosed(paidNotCollected)).toBe(false);
    expect(isClosed({ delivery_status: "delivered", payment_status: "paid", due_cents: 0 })).toBe(true);
  });
});

describe("filters", () => {
  const takenUnpaid: OrderState = { delivery_status: "delivered", payment_status: "unpaid", due_cents: 500 };
  const paidNotCollected: OrderState = { delivery_status: "pending", payment_status: "paid", due_cents: 0 };
  const fresh: OrderState = { delivery_status: "pending", payment_status: "unpaid", due_cents: 500 };
  const done: OrderState = { delivery_status: "delivered", payment_status: "paid", due_cents: 0 };
  // Everything ordered is pending restock: nothing to pay yet.
  const allPending: OrderState = { delivery_status: "pending", payment_status: "unpaid", due_cents: 0 };
  const all = [takenUnpaid, paidNotCollected, fresh, done, allPending];

  it("to_deliver = not handed over yet", () => {
    expect(all.map((o) => matchesOrderFilter(o, "to_deliver"))).toEqual([false, true, true, false, true]);
  });

  it("to_collect includes garments already taken but unpaid, and ignores what is only pending restock", () => {
    expect(all.map((o) => matchesOrderFilter(o, "to_collect"))).toEqual([true, false, true, false, false]);
  });

  it("closed = delivered and fully paid; all matches everything", () => {
    expect(all.map((o) => matchesOrderFilter(o, "closed"))).toEqual([false, false, false, true, false]);
    expect(matchesOrderFilter(fresh, "all")).toBe(true);
  });
});

describe("matchesOrderSearch", () => {
  const o = { order_number: 42, memberName: "Anna Puig", memberNickname: "Flama" };

  it("matches member name or nickname, case-insensitive", () => {
    expect(matchesOrderSearch(o, "anna")).toBe(true);
    expect(matchesOrderSearch(o, "FLAMA")).toBe(true);
    expect(matchesOrderSearch(o, "pau")).toBe(false);
  });

  it("matches the order number in any common form", () => {
    for (const q of ["42", "0042", "DIABLES-0042", "diables-42"]) {
      expect(matchesOrderSearch(o, q)).toBe(true);
    }
    expect(matchesOrderSearch(o, "43")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(matchesOrderSearch(o, "  ")).toBe(true);
  });
});

describe("debt", () => {
  const orders = [
    { member_id: "m1", due_cents: 1500 },
    { member_id: "m1", due_cents: 2000 },
    { member_id: "m1", due_cents: 0 }, // paid, or only pending restock
    { member_id: "m2", due_cents: 0 },
    { member_id: "m3", due_cents: 700 },
  ];

  it("sums what is due per member and omits members who owe nothing", () => {
    expect(Object.fromEntries(debtByMember(orders))).toEqual({ m1: 3500, m3: 700 });
  });

  it("totals what is pending across members", () => {
    expect(totalPending(orders)).toBe(4200);
    expect(totalPending([])).toBe(0);
  });
});

describe("payable now vs. pending restock", () => {
  // 3 shirts at 10 €: 1 in stock, 2 pending; plus 1 cap at 5 € fully in stock.
  const lines = [
    { quantity: 3, backorderedQuantity: 2, unitPriceCents: 1000 },
    { quantity: 1, backorderedQuantity: 0, unitPriceCents: 500 },
  ];

  it("separates what is covered by stock from what waits for it", () => {
    expect(coveredCents(lines)).toBe(1500);
    expect(pendingCents(lines)).toBe(2000);
    expect(coveredCents(lines) + pendingCents(lines)).toBe(orderTotal(lines.map((l) => ({ quantity: l.quantity, unitPriceCents: l.unitPriceCents }))));
  });

  it("the amount due is what is covered minus what was already paid, never negative", () => {
    expect(amountDueCents(lines, 0)).toBe(1500);
    expect(amountDueCents(lines, 1500)).toBe(0);
    expect(amountDueCents(lines, 9999)).toBe(0);
  });

  it("the amount due grows when stock arrives for a partly paid order", () => {
    const paid = 1500; // covered part was paid
    expect(amountDueCents(lines, paid)).toBe(0);
    const afterRestock = [
      { quantity: 3, backorderedQuantity: 0, unitPriceCents: 1000 },
      { quantity: 1, backorderedQuantity: 0, unitPriceCents: 500 },
    ];
    expect(amountDueCents(afterRestock, paid)).toBe(2000);
  });

  it("an order with everything pending owes nothing yet", () => {
    expect(amountDueCents([{ quantity: 2, backorderedQuantity: 2, unitPriceCents: 1000 }], 0)).toBe(0);
  });

  it("splits a cart into pay-now and pay-later totals", () => {
    expect(
      cartTotals([
        { quantity: 3, stock: 1, unitPriceCents: 1000 },
        { quantity: 1, stock: 4, unitPriceCents: 500 },
        { quantity: 2, stock: 0, unitPriceCents: 700 },
      ]),
    ).toEqual({ dueNowCents: 1500, laterCents: 3400 });
  });
});

describe("compareSizes", () => {
  it("orders letter sizes from small to large, with 'única' after them", () => {
    const sizes = ["XL", "única", "S", "XXL", "M", "XS", "L"];
    expect([...sizes].sort(compareSizes)).toEqual(["XS", "S", "M", "L", "XL", "XXL", "única"]);
  });

  it("orders numeric sizes numerically and puts unknown ones last", () => {
    expect(["12", "8", "10", "Nen", "S"].sort(compareSizes)).toEqual(["S", "8", "10", "12", "Nen"]);
  });
});

describe("parsePriceToCents", () => {
  it("accepts common ways of typing a price", () => {
    expect(parsePriceToCents("15")).toBe(1500);
    expect(parsePriceToCents("15,5")).toBe(1550);
    expect(parsePriceToCents("15.50")).toBe(1550);
    expect(parsePriceToCents(" 15,00 € ")).toBe(1500);
    expect(parsePriceToCents("1.234,50")).toBe(123450);
    expect(parsePriceToCents("0")).toBe(0);
  });

  it("rejects empty, negative, sub-cent and non-numeric input", () => {
    for (const bad of ["", " ", "-5", "15,999", "abc", "1,2,3", "12e3"]) {
      expect(parsePriceToCents(bad)).toBeNull();
    }
  });

  it("round-trips with centsToPriceInput", () => {
    expect(centsToPriceInput(1550)).toBe("15,50");
    expect(parsePriceToCents(centsToPriceInput(1999))).toBe(1999);
  });
});

describe("validateVariants", () => {
  it("accepts unique sizes with non-negative integer stock", () => {
    expect(validateVariants([{ size: "S", stock: 0 }, { size: "M", stock: 4 }])).toEqual([]);
  });

  it("requires at least one size", () => {
    expect(validateVariants([])).toEqual([{ code: "no_variants" }]);
  });

  it("rejects blank sizes and duplicates ignoring case and spaces", () => {
    expect(validateVariants([{ size: "  ", stock: 1 }])).toEqual([{ code: "empty_size" }]);
    expect(validateVariants([{ size: "M", stock: 1 }, { size: " m ", stock: 2 }])).toEqual([
      { code: "duplicate_size", size: "m" },
    ]);
  });

  it("rejects negative or fractional stock", () => {
    expect(validateVariants([{ size: "S", stock: -1 }])).toEqual([{ code: "invalid_stock", size: "S" }]);
    expect(validateVariants([{ size: "S", stock: 1.5 }])).toEqual([{ code: "invalid_stock", size: "S" }]);
  });
});
