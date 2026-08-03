# Sky POS — User Manual

This guide explains how to use the Point of Sale (POS) system for daily operations: inventory, sales, offers, and settings. It is written for shop staff and managers.

---

## Table of contents

1. [Before you start](#1-before-you-start)
2. [Inventory and stock](#2-inventory-and-stock)
3. [Understanding negative and oversold stock](#3-understanding-negative-and-oversold-stock)
4. [Fixing stock problems](#4-fixing-stock-problems)
5. [POS sales (quick checkout)](#5-pos-sales-quick-checkout)
6. [Offers and discounts](#6-offers-and-discounts)
7. [Order settings that affect stock and sales](#7-order-settings-that-affect-stock-and-sales)
8. [Purchases (receiving stock)](#8-purchases-receiving-stock)
9. [Receipts and printing](#9-receipts-and-printing)
10. [Frequently asked questions](#10-frequently-asked-questions)

---

## 1. Before you start

### 1.1 Connect to the server (first-time setup)

On a new device or browser, open the POS and go to **Configure backend** (`/pos/configure`).

1. Enter your **API URL** (server address), for example `https://your-server.com/api` or `http://127.0.0.1:8000`.
2. Run **Test connection**.
3. Save when the test succeeds.
4. Log in with your user account.

You only need to do this once per device unless the server address changes.

### 1.2 Main menu areas

| Area | Purpose |
|------|---------|
| **Sales / POS** | Ring up customers, hold orders, checkout |
| **Inventory** | View stock, value, low stock, adjustments |
| **Items** | Create and edit products |
| **Purchasing** | Receive stock from suppliers |
| **Offers** | Product and order discounts |
| **Settings** | Company, order, payment, inventory rules |

---

## 2. Inventory and stock

### 2.1 Inventory Dashboard

Go to **Inventory → Inventory Dashboard**.

The table shows each stock record with:

| Column | Meaning |
|--------|---------|
| **Item No** | Product code |
| **Description** | Product name |
| **Branch** | Location / branch where stock is held |
| **UOM** | Unit of measure (pcs, kg, pack, l, etc.) |
| **Qty** | Quantity **on hand** at that branch |
| **Reorder** | Level at which low-stock warning appears |
| **Expiry** | Nearest expiry date (if tracked) |
| **Purchase (Rs)** | Last purchase price per unit |
| **Unit Cost** | Cost used for inventory valuation |
| **Value** | Stock value = on-hand qty × unit cost |

Summary cards at the top show **stock value**, **item count**, **low stock**, and **expiring/expired** items.

### 2.2 Units of measure (UOM)

Quantities always show with their unit, for example `5 pcs` or `2.50 kg`.

- To add new unit types: **Items → Item Settings → Units of measure**
- To assign a unit to a product: **Edit item → Stock Details → Unit of measure**

### 2.3 Low stock

A row is highlighted when **Qty ≤ Reorder** (and reorder is greater than zero). Use this to plan purchases.

### 2.4 Row actions (⋯ menu)

From each inventory row you can:

- **View** — item details
- **History** — sales, purchases, and movements
- **Edit** — open the item form
- **Cost view** — costing breakdown
- **Inventory adjustment** — set or change quantity manually
- **Write-off items** — remove damaged or lost stock

---

## 3. Understanding negative and oversold stock

### 3.1 What you see on screen

The system **does not** show a negative quantity in the main **Qty** column anymore.

| Situation | Qty column | Extra line |
|-----------|------------|------------|
| Normal stock | `5 pcs` | — |
| Sold out | `0 pcs` | — |
| **Oversold** (sold below zero) | `0 pcs` | red **Short 1 pcs** (or kg, pack, etc.) |

**Value** is never negative: if on-hand qty is zero, value shows **Rs 0.00**.

A yellow **warning banner** appears on the Inventory Dashboard when one or more items are oversold. It tells you how many items need stock received.

### 3.2 What “oversold” means

**Oversold** means a sale was completed when there was **not enough stock** on hand. Example:

- Stock before sale: **0 pcs**
- Customer buys: **1 pcs**
- Stock in database: **−1 pcs** (oversold by 1)

This is **not** a display error. It records that you owe the customer one unit that was not in the warehouse.

### 3.3 Why it happens

Overselling is allowed only when this setting is **ON**:

**Settings → Order Settings → Allow sales for items with negative inventory**

| Setting | When ON | When OFF |
|---------|---------|----------|
| Allow sales for items with negative inventory | Sales can finish even at 0 stock; qty can go negative | POS blocks adding more than available stock; backend rejects insufficient stock |

**Common causes of oversold items:**

1. Setting above was **enabled** and staff sold at zero stock.
2. Sale completed from **Hold order** or **classic sale form** after stock was already depleted.
3. Stock was never received (new item sold before first purchase).
4. Wrong branch: stock exists at another branch but sale used a branch with 0 qty.

### 3.4 What oversold does *not* mean

- It does **not** mean the product is broken in the system.
- It does **not** mean you must delete the item.
- It **does** mean you should **receive stock** or **adjust inventory** to correct quantities.

---

## 4. Fixing stock problems

### 4.1 Recommended steps (oversold items)

1. **Find oversold items** — Inventory Dashboard; look for red **Short …** under Qty.
2. **Receive stock** — create a **Purchase** for the correct quantity from your supplier.
3. **Or adjust manually** — row menu → **Inventory adjustment** → set the correct **new qty**.
4. **Prevent repeat** — if you do not want overselling, go to **Settings → Order Settings** and turn **OFF** *Allow sales for items with negative inventory*.
5. **Check History** — row menu → **History** to see which sales reduced stock.

### 4.2 Example: item 10184 shows `0 pcs` and `Short 1 pcs`

| Step | Action |
|------|--------|
| 1 | You sold 1 unit when stock was 0 |
| 2 | Purchase 1 unit (or more) **or** adjustment to qty `1` |
| 3 | After correction: Qty shows `1 pcs`, Short line disappears |
| 4 | Value updates to purchase/cost × on-hand qty |

### 4.3 Inventory adjustment (manual correction)

1. Inventory Dashboard → **⋯** on the row → **Inventory adjustment**
2. Enter **new quantity** or **quantity change**
3. Add a note (reason) if your process requires it
4. Save

Adjustments cannot set quantity below zero through the adjustment screen (minimum is 0). To fix oversold data, enter the **true** on-hand count after you physically receive goods.

### 4.4 Write-off

Use **Write-off items** only for stock that is lost, damaged, or expired — not for normal sales.

---

## 5. POS sales (quick checkout)

### 5.1 Product screen

1. Open **Sales → New sale** (POS layout).
2. Search or browse products; tap to add to cart.
3. Cart footer shows line count, subtotal, offer discount (if any), and total.
4. Switch **Retail / Wholesale** if your company allows it (Order Settings).
5. Tap **Checkout** when ready.

### 5.2 Stock checks at POS

When **Allow sales for items with negative inventory** is **OFF**:

- Out-of-stock items cannot be added.
- Quantity cannot exceed available stock at the sale branch.
- Messages such as *“Only X pcs available”* appear.

When the setting is **ON**:

- Sales can continue at zero stock.
- Stock may become oversold (see [Section 3](#3-understanding-negative-and-oversold-stock)).

### 5.3 Checkout

On checkout you can set:

- Customer
- Manual discount (if allowed)
- **Delivery / service charge** (if enabled in Order Settings)
- Payment method and amount received
- Offers (applied automatically when rules match — see [Section 6](#6-offers-and-discounts))

### 5.4 Hold orders

- **Hold** saves the cart without completing payment/stock (depending on status).
- Resume from **Hold orders** panel.
- Completing a hold deducts stock like a normal sale.

---

## 6. Offers and discounts

### 6.1 Offer types

| Type | Applies to | Example |
|------|------------|---------|
| **Product offer** | Specific products in the cart | 8% off when buying 3+ of item X |
| **Order offer** | Whole order total | 10% off when order ≥ Rs 5,000 |
| **Promo order offer** | Whole order when code entered | 5% off with code `SAVE5` |

### 6.2 Creating an offer

Go to **Offers → Add offer**.

1. **Name** — required.
2. **Discount type** — Product or Order.
3. **Apply offer on** — Retail only, Wholesale only, or Retail & Wholesale.
4. **Product offer** — select products and enable a product rule (e.g. % off selected items).
5. **Order offer** — enable *minimum order total* and/or *promo code* rules.
6. Set active dates / days of week if needed.
7. Save.

### 6.3 Automatic application at POS

The POS applies offers without a dropdown when possible:

1. **Product offers** — if offer products are in the cart and the rule gives a discount.
2. **Order offers (min total)** — if cart subtotal meets the minimum.
3. **Promo offers** — when the customer enters a valid promo code.

If both product and order offers apply, the system uses whichever saves the customer more.

### 6.4 Manual discount vs offer

- **Offer discount** — from an active offer rule; shown in offer breakdown.
- **Manual order discount** — entered on the sale form if *Allow order discount* is enabled in settings.

Both reduce the total; offer discount is calculated by the offer engine and sent with `offer_id` on save.

### 6.5 Troubleshooting offers

| Problem | Check |
|---------|--------|
| Order offer not applying | Min order amount reached? Offer active today? Pricing mode matches Retail/Wholesale? *Allow offer* ON in Order Settings? |
| Product offer not applying | Correct products in cart? Quantity rule met (e.g. buy 3)? |
| Promo not applying | Code spelling (case-insensitive); promo rule enabled on offer |
| Offer missing after mode switch | Offer may be Retail-only while sale is Wholesale (or vice versa) |

---

## 7. Order settings that affect stock and sales

Go to **Settings → Order Settings**.

| Setting | Effect |
|---------|--------|
| **Allow sales for items with negative inventory** | Allows selling at 0 stock; can create oversold (Short) items |
| **Allow quotation for items with negative inventory** | Same idea for quotations |
| **Allow delivery / service charge** | Delivery cost field at checkout |
| **Allow offer** | Enables offers at POS |
| **Allow switching wholesale / retail prices** | Price mode toggle on POS |
| **Allow order discount** | Manual discount on sales |

After changing settings, save and refresh POS if behaviour does not update immediately.

---

## 8. Purchases (receiving stock)

Purchases **increase** stock at the chosen branch.

1. Go to **Purchasing → New purchase**
2. Select supplier, branch, and items with quantities
3. Complete the purchase
4. Verify quantities on **Inventory Dashboard**

Receiving purchase stock is the normal way to clear **Short** (oversold) lines.

---

## 9. Receipts and printing

- Completed sales can be printed from the sales list or immediately after checkout (depending on your workflow).
- Receipts include company header and a **Sky Smart Technologies** software footer on printed copies.
- Letterhead top margin is reduced on narrow (80 mm) receipts to avoid large blank space.

Configure printer and header under **Settings → Company** and hardware/print settings as provided by your administrator.

---

## 10. Frequently asked questions

### Why does Qty show 0 but say “Short 1 pcs”?

You sold one more unit than you had. Receive or adjust stock — see [Section 4](#4-fixing-stock-problems).

### Why is Value Rs 0.00 when I still have a cost?

Value is based on **on-hand** quantity only. Oversold items show 0 on hand until stock is received.

### Can I hide oversold items?

Use filters on Inventory Dashboard (product type, branch). Fix or receive stock to clear the Short status.

### How do I stop negative stock completely?

Turn **OFF** *Allow sales for items with negative inventory* in Order Settings. Train staff that POS will block sales when qty is 0.

### I sold at zero stock before turning the setting off. What now?

Past sales already reduced stock. Use Purchase or Inventory adjustment to set correct quantities.

### Where is the real quantity stored?

The database may still hold a negative `qty` for oversold tracking. The dashboard shows **0 on hand** plus **Short** for clarity. After you receive stock, the number returns to normal.

### Who can change purchase price on the dashboard?

Controlled by **Item Settings → Allow editing purchase price in inventory dashboard**. If disabled, purchase price is read-only on the grid.

---

## Quick reference card — Oversold stock

```
SYMPTOM:   Qty = 0 pcs, red "Short 1 pcs", Value = Rs 0.00
CAUSE:     Sale completed with insufficient stock
FIX:       Purchase or Inventory adjustment
PREVENT:   Order Settings → OFF "Allow sales for items with negative inventory"
VERIFY:    History on row → see sale movements
```

---

## Document information

| | |
|--|--|
| **Product** | Sky POS |
| **Audience** | Shop staff, supervisors, managers |
| **Topics** | Inventory, oversold stock, POS sales, offers, settings |
| **Version** | 1.0 — June 2026 |

For technical API or deployment documentation, see `backend/API_DOCUMENTATION.md` and `sky-sample-website-frontend/DEPLOY.md`.

---

*Sky Smart Technologies — POS User Manual*
