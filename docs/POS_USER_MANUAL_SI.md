# Sky POS — පරිශීලක අත්පොත (සිංහල)

**Sky Smart Technologies** POS පද්ධතියේ සම්පූර්ණ මාර්ගෝපදේශය — විකිණීම්, තොග, මිලදී ගැනීම, ගෙවීම්, වාර්තා සහ සැකසීම්.

**අනුවාදය:** 1.0 | **දිනය:** 2026 ජූනි

---

## අන්තර්ගතය

1. [හැඳින්වීම](#1-හැඳින්වීම)
2. [පද්ධතියට පිවිසීම](#2-පද්ධතියට-පිවිසීම)
3. [ප්‍රධාන මෙනුව](#3-ප්‍රධාන-මෙනුව)
4. [උපකරණ පුවරුව (Dashboard)](#4-උපකරණ-පුවරුව-dashboard)
5. [විකිණීම් (Sales / POS)](#5-විකිණීම්-sales--pos)
6. [ගෙවීම් (Payments)](#6-ගෙවීම්-payments)
7. [වියදම් (Expenses)](#7-වියදම්-expenses)
8. [ගනුදෙනුකරුවන් (Customers)](#8-ගනුදෙනුකරුවන්-customers)
9. [භාණ්ඩ (Items)](#9-භාණ්ඩ-items)
10. [තොග (Inventory)](#10-තොග-inventory)
11. [මිලදී ගැනීම (Purchasing)](#11-මිලදී-ගැනීම-purchasing)
12. [සැපයුම්කරුවන් (Suppliers)](#12-සැපයුම්කරුවන්-suppliers)
13. [නැව්ගත කිරීම (Shipping)](#13-නැව්ගත-කිරීම-shipping)
14. [පිරිනැමීම් (Offers)](#14-පිරිනැමීම්-offers)
15. [අළුත්වැඩියා (Repair)](#15-අළුත්වැඩියා-repair)
16. [වාර්තා (Reports)](#16-වාර්තා-reports)
17. [සැකසීම් (Settings)](#17-සැකසීම්-settings)
18. [පොදු ප්‍රශ්න](#18-පොදු-ප්‍රශ්න)

---

## 1. හැඳින්වීම

Sky POS යනු කුඩා හා මධ්‍යම ව්‍යාපාර සඳහා නිර්මාණය කළ **විකුණුම් ස්ථාන (Point of Sale)** පද්ධතියකි. මෙයින් ඔබට:

- භාණ්ඩ විකිණීම් සහ ආපසු ලැබීම් කළමනාකරණය
- තොග පරිමාණ සහ වටිනාකම නිරීක්ෂණය
- සැපයුම්කරුවන්ගෙන් භාණ්ඩ ලැබීම (මිලදී ගැනීම)
- ගනුදෙනුකරු ගෙවීම් සහ වියදම්
- පිරිනැමීම් සහ වට්ටම්
- වාර්තා සහ මුදල් විගණනය

කළ හැක.

**භාවිතා කරන්නේ කවුද:** කළුණු සේවකයින්, සුපරිවේක්ෂකයින්, ගබඩා කළමනාකරුවන්.

---

## 2. පද්ධතියට පිවිසීම

### 2.1 පළමු වර සැකසීම (Backend Configure)

නව පරිගණකයක හෝ බ්‍රවුසරයක පළමු වර භාවිතා කරන විට:

1. POS විවෘත කර **Configure backend** (`/pos/configure`) වෙත යන්න.
2. **API URL** ඇතුළත් කරන්න (සර්වර ලිපිනය), උදා: `http://127.0.0.1:8000` හෝ `https://your-server.com`
3. **Test connection** ඔබන්න — සාර්ථක නම් Save කරන්න.
4. පසුව **Login** වෙතින් පරිශීලක නාමය සහ මුරපදය ඇතුළත් කරන්න.

### 2.2 ලියාපදිංචිය (Register)

නව සමාගමක් සඳහා `/pos/register` හරහා ලියාපදිංචි විය හැක. පවතින ගිණුමක් තිබේ නම් Login භාවිතා කරන්න.

### 2.3 මුරපදය වෙනස් කිරීම

**Settings → User → Profile** හරහා මුරපදය වෙනස් කළ හැක.

---

## 3. ප්‍රධාන මෙනුව

වම් පැති තීරුවේ (Sidebar) ප්‍රධාන කොටස්:

| මෙනුව | මාර්ගය | කාර්යය |
|--------|--------|--------|
| Dashboard | `/pos/dashboard` | දිනපතා සාරාංශය |
| Sales | `/pos/sales` | විකිණීම් |
| Payments | `/pos/payments` | ගෙවීම් |
| Expenses | `/pos/expenses` | වියදම් |
| Customers | `/pos/customers` | ගනුදෙනුකරුවන් |
| Items | `/pos/items` | භාණ්ඩ කළමනාකරණය |
| Inventory | `/pos/inventory` | තොග පුවරුව |
| Purchasing | `/pos/purchasing` | මිලදී ගැනීම |
| Suppliers | `/pos/suppliers` | සැපයුම්කරුවන් |
| Shipping | `/pos/shipping` | නැව්ගත කිරීම |
| Offers | `/pos/offers` | පිරිනැමීම් |
| Repair | `/pos/repair` | අළුත්වැඩියා |
| Reports | `/pos/reports` | වාර්තා |
| Settings | `/pos/settings` | සැකසීම් |

ඔබගේ **භූමිකාව (Role)** අනුව සමහර මෙනු සීමා වී තිබිය හැක.

---

## 4. උපකරණ පුවරුව (Dashboard)

**මාර්ගය:** `/pos/dashboard`

උපකරණ පුවරුවේ පෙන්වන දේ:

- අද / මෙම මාසයේ **විකිණීම්**, **මිලදී ගැනීම්**, **ගෙවීම්**, **වියදම්**
- **Hold Orders** (රඳවා තබන ලද ඇණවුම්)
- **Low stock** (අඩු තොග) භාණ්ඩ
- **Shipments** (නැව්ගත කිරීම්)
- විකිණීම් ප්‍රවණතා ප්‍රස්ථාරය
- මෑත ගනුදෙනු

දත්ත ස්වයංක්‍රීයව යාවත්කාලීන වේ — Refresh ඔබන්න අවශ්‍ය නැත.

---

## 5. විකිණීම් (Sales / POS)

### 5.1 විකිණීම් පුවරුව

**මාර්ගය:** `/pos/sales`

- සියලු විකිණීම්, ආපසු ලැබීම්, උපුටා දැක්වීම් (Quotations) ලැයිස්තුව
- දිනය, ශාඛාව, ගනුදෙනු වර්ගය අනුව **පෙරහන්**
- ලියපත **මුද්‍රණය** / බාගත කිරීම
- විකිණීම් **සංස්කරණය** / මකා දැමීම

### 5.2 නව විකිණීම (POS තිරය)

**මාර්ගය:** `/pos/sales/new`

POS විකිණීම් දෙපියවරකි:

**පියවර 1 — භාණ්ඩ තේරීම (Products)**

1. වර්ගය (Category) හෝ සෙවුම් පෙට්ටියෙන් භාණ්ඩ සොයන්න.
2. භාණ්ඩය තට්ටු කර **කරත්තයට** එක් කරන්න.
3. **Retail / Wholesale** මිල මාරු කිරීම (සැකසීම් අනුව)
4. කරත්තයේ එකතුව, පිරිනැමීම් වට්ටම් (ඇත්නම්) පහළින් පෙනේ.
5. **Checkout** ඔබන්න.

**පියවර 2 — ගෙවීම (Checkout)**

- ගනුදෙනුකරු තෝරන්න (අවශ්‍ය නම්)
- අතිරේක වට්ටම් (Manual discount — සැකසීම් අනුව)
- **Delivery / Service charge** (සැකසීම් අනුව)
- ගෙවීම් ක්‍රමය: Cash, Card, Cheque, Credit, Bank Transfer
- ලැබූ මුදල / ඉතිරි මුදල
- විකිණීම **සම්පූර්ණ කරන්න** හෝ **Hold** (රඳවා තබන්න)

### 5.3 Hold Orders (ඇණවුම් රඳවා තැබීම)

- ගෙවීම නොකර ඇණවුම රඳවා තැබිය හැක.
- **Hold Orders** පැනලයෙන් නැවත ආරම්භ කර සම්පූර්ණ කළ හැක.
- Hold සම්පූර්ණ වූ විට තොග අඩු වේ.

### 5.4 තොග පරීක්ෂාව POS හි

**Settings → Order Settings → Allow sales for items with negative inventory**

| සැකසීම | ON | OFF |
|--------|----|----|
| ඍණ තොග විකිණීම | තොග 0 වූ විටත් විකිණීමට ඉඩ | තොග නැති විට විකිණීම අවහිර |
| POS පණිවිඩය | විකිණීමට ඉඩ | "Out of stock" / "Only X available" |

### 5.5 ආපසු ලැබීම් සහ උපුටා දැක්වීම්

- විකිණීම් පුවරුවේ Transaction Type අනුව Return හෝ Quotation පෙරහන් කරන්න.
- `/pos/sales/:id/edit` හරහා සංස්කරණය කරන්න.

---

## 6. ගෙවීම් (Payments)

**මාර්ගය:** `/pos/payments`

- ගනුදෙනුකරු / සැපයුම්කරු **ගෙවීම් ලියපත්**
- ගෙවීම් ක්‍රමය, වර්ගය, ශාඛාව, දිනය අනුව පෙරහන්
- නව ගෙවීම් ලියපත සෑදීම / සංස්කරණය

**ගෙවීම් වර්ග:** Sale, Return, Credit Note, Advance ආදිය.

---

## 7. වියදම් (Expenses)

**මාර්ගය:** `/pos/expenses`

- සමාගම් වියදම් ලියාපත් කිරීම
- වර්ගය (Category), ගෙවීම් ක්‍රමය, ශාඛාව අනුව පෙරහන්
- **New expense** හරහා නව වියදම් එක් කිරීම
- වියදම් වර්ග කළමනාකරණය

---

## 8. ගනුදෙනුකරුවන් (Customers)

**මාර්ගය:** `/pos/customers`

- ගනුදෙනුකරු ලැයිස්තුව සහ **ලැබිය යුතු මුදල් (Receivables)**
- නව ගනුදෙනුකරු එක් කිරීම / සංස්කරණය
- **Start sale** — එම ගනුදෙනුකරු සමඟ විකිණීමක් ආරම්භ කිරීම (`/pos/sales/new?customerId=...`)

---

## 9. භාණ්ඩ (Items)

**මාර්ගය:** `/pos/items`

භාණ්ඩය යනු විකිණීම් සහ තොගයේ **මූලික වාර්තාව**යි.

### 9.1 භාණ්ඩ පුවරුව

- Item No, විස්තරය, වර්ගය, ශාඛාව, UOM, මිල, තොග පරිමාණය
- කල් ඉකුත් වීම (Expiry) තත්ත්වය
- Active / Inactive

### 9.2 නව භාණ්ඩයක් එක් කිරීම

**මාර්ගය:** `/pos/items/new`

ප්‍රධාන ක්ෂේත්‍ර:

| ක්ෂේත්‍රය | විස්තරය |
|----------|---------|
| Item Number | භාණ්ඩ අංකය (ස්වයංක්‍රීය හෝ අතින්) |
| Description | නම / විස්තරය |
| Category / Sub category | වර්ගීකරණය |
| Branch (Location) | ශාඛාව |
| UOM | මිනුම් ඒකකය (pcs, kg, pack, l...) |
| Selling / Wholesale price | විකුණුම් මිල |
| Purchase price | මිලදී ගැනීම් මිල |
| Qty | ආරම්භක තොග (අවශ්‍ය නම්) |
| Reorder qty | අඩු තොග අනතුරු ඇඟවීම |
| Track with inventory | තොග ලුහුබැඳීම ON/OFF |
| Expiry date | කල් ඉකුත් දිනය (අවශ්‍ය නම්) |

### 9.3 වර්ග (Categories)

**මාර්ගය:** `/pos/items/categories`

- Item categories සහ sub-categories කළමනාකරණය
- POS තිරයේ වර්ග ටැබ් වලට භාවිතා වේ

### 9.4 භාණ්ඩ සැකසීම්

**මාර්ගය:** `/pos/items/settings` හෝ `/pos/settings/item`

- SKU, UOM ලැයිස්තුව, default discount, thresholds ආදිය

---

## 10. තොග (Inventory)

**මාර්ගය:** `/pos/inventory`

### 10.1 තොග පුවරුවේ තීරු

| තීරුව | අර්ථය |
|-------|--------|
| Item No | භාණ්ඩ අංකය |
| Description | නම |
| Branch | ශාඛාව |
| UOM | මිනුම් ඒකකය |
| Qty | අතින් ඇති ප්‍රමාණය |
| Reorder | නැවත ඇණවුම් මට්ටම |
| Expiry | කල් ඉකුත් දිනය |
| Purchase (Rs) | මිලදී ගැනීම් මිල |
| Unit Cost | ඒකක පිරිවැය |
| Value | තොග වටිනාකම |

සාරාංශ කාඩ්: **stock value**, **items**, **low stock**, **expiring/expired**

### 10.2 ඍණ / අධික විකිණුම් තොග (Oversold)

තොග **0** වූ විට විකිණීම සිදු වුවහොත්:

- **Qty** තීරුව: `0 pcs` (හෝ kg, pack)
- රතු පාටින්: **Short 1 pcs** — අඩුව ඇති ප්‍රමාණය
- **Value:** Rs 0.00 (ඍණ වටිනාකම නොපෙන්වයි)

**හේතුව:** Order Settings හි *Allow sales for items with negative inventory* ON වී තිබීම.

**פתרון:**

1. **Purchasing** හරහා තොග ලබා ගන්න
2. හෝ ⋯ මෙනුව → **Inventory adjustment** — නිවැරදි ප්‍රමාණය ඇතුළත් කරන්න
3. අනාගතයේ අවහිර කිරීමට: Order Settings හි ඉහත සැකසීම **OFF** කරන්න

### 10.3 පේළි ක්‍රියා (⋯ මෙනුව)

- **View** — විස්තර බලන්න
- **History** — විකිණීම්, මිලදී ගැනීම්, චලන ඉතිහාසය
- **Edit** — භාණ්ඩය සංස්කරණය
- **Cost view** — පිරිවැය විගණනය
- **Inventory adjustment** — තොග සංශෝධනය
- **Write-off** — හානි/කල් ඉකුත් භාණ්ඩ ඉවත් කිරීම

### 10.4 UOM (මිනුම් ඒකක)

- නව ඒකක: **Items → Item Settings → Units of measure**
- භාණ්ඩයට ඒකකය: **Edit item → Stock Details → Unit of measure**

---

## 11. මිලදී ගැනීම (Purchasing)

**මාර්ගය:** `/pos/purchasing`

### 11.1 මිලදී ගැනීම් පුවරුව

- සියලු මිලදී ගැනීම් ලියපත්
- Invoice ID, සැපයුම්කරු, දිනය, ශාඛාව අනුව පෙරහන්
- ලියපත මුද්‍රණය

### 11.2 නව මිලදී ගැනීම

**මාර්ගය:** `/pos/purchasing/new`

1. සැපයුම්කරු තෝරන්න
2. ශාඛාව තෝරන්න
3. භාණ්ඩ තෝරා ප්‍රමාණය ඇතුළත් කරන්න
4. Checkout → සම්පූර්ණ කරන්න
5. **තොග වැඩි වේ** — Inventory පුවරුවෙන් තහවුරු කරන්න

---

## 12. සැපයුම්කරුවන් (Suppliers)

**මාර්ගය:** `/pos/suppliers`

- සැපයුම්කරු ලැයිස්තුව
- **ගෙවිය යුතු මුදල් (Payables)** සාරාංශය
- නව සැපයුම්කරු / සංස්කරණය

---

## 13. නැව්ගත කිරීම (Shipping)

**මාර්ගය:** `/pos/shipping`

- නැව්ගත කිරීම් (Shipments) ලැයිස්තුව
- තත්ත්වය, ශාඛාව, දිනය අනුව පෙරහන්
- නව Shipment — බොහෝ විට විකිණීමකට සම්බන්ධ වේ
- Freight (ගාස්තු) සාරාංශය

---

## 14. පිරිනැමීම් (Offers)

**මාර්ගය:** `/pos/offers`

### 14.1 පිරිනැමීම් වර්ග

| වර්ගය | යෙදෙන්නේ | උදාහරණය |
|-------|----------|---------|
| **Product offer** | නිශ්චිත භාණ්ඩ | 3+ ගත් විට 8% වට්ටම් |
| **Order offer** | සම්පූර්ණ ඇණවුම | Rs 5000+ වූ විට 10% වට්ටම් |
| **Promo offer** | ප්‍රොමෝ කේතය | SAVE5 කේතයෙන් 5% |

### 14.2 පිරිනැමීමක් සෑදීම

**මාර්ගය:** `/pos/offers/new`

1. **Name** — අනිවාර්ය නම
2. **Discount type** — Product හෝ Order
3. **Apply offer on** — Retail only / Wholesale only / Retail & Wholesale
4. Product: භාණ්ඩ තෝරා නීති සක්‍රීය කරන්න
5. Order: Min order total සහ/හෝ Promo code නීති
6. Active දින / දිනවල වගකීම
7. Save

### 14.3 POS හි ස්වයංක්‍රීය යෙදීම

POS හි පිරිනැමීම් බොහෝ විට **ස්වයංක්‍රීයව** යෙදේ:

1. කරත්තයේ පිරිනැමීම් භාණ්ඩ තිබේ නම් → Product offer
2. ඇණවුම් එකතුව අවම මුදලට ළඟා වේ නම් → Order offer
3. ප්‍රොමෝ කේතය නිවැරදි නම් → Promo offer

Product සහ Order දෙකම යෙදේ නම් — **වැඩි වට්ටම්** දෙන එක තෝරයි.

### 14.4 පිරිනැමීම් නොයෙදෙන විට පරීක්ෂා කරන්න

- Order Settings → **Allow offer** ON ද?
- අවම ඇණවුම ළඟා වුණා ද?
- Retail/Wholesale ගැලපෙනවා ද?
- Product offer: ප්‍රමාණ නීතිය (උදා: 3+) සපුරා තිබේ ද?

---

## 15. අළුත්වැඩියා (Repair)

**මාර්ගය:** `/pos/repair`

- අළුත්වැඩියා මධ්‍යස්ථානයට යවන භාණ්ඩ
- **Send** (`/pos/repair/send`) — භාණ්ඩ යැවීම
- **Receive** (`/pos/repair/receive`) — භාණ්ඩ ලැබීම
- අළුත්වැඩියා තොග පුවරුව

---

## 16. වාර්තා (Reports)

**මාර්ගය:** `/pos/reports`

### 16.1 වාර්තා කාණ්ඩ

| කාණ්ඩය | උදාහරණ වාර්තා |
|---------|----------------|
| **Sales** | Sales summary, details, returns, customer payment |
| **Expense** | Expense summary |
| **Item** | Reorder items, expiry, inventory summary, write-off |
| **Customer** | Customer list, outstanding, aging, activity |
| **Supplier** | Supplier detail, activity |
| **Purchase** | Purchase details, supplier payment |
| **Finance** | Cash in hand, profit, income/expenses, end of day |
| **Audit** | Audit report, transaction summary |

### 16.2 වාර්තාවක් බැලීම

1. කාණ්ඩය තෝරන්න
2. වාර්තාව තෝරන්න
3. දින පරාසය සහ ශාඛාව තෝරන්න
4. ප්‍රතිඵලය බලන්න / නිර්යාත කරන්න

---

## 17. සැකසීම් (Settings)

**මාර්ගය:** `/pos/settings`

### 17.1 සැකසීම් ප්‍රධාන කොටස්

| කොටස | මාර්ගය | කාර්යය |
|------|--------|--------|
| **User** | `/pos/settings/user` | Profile, Users, Roles |
| **Company** | `/pos/settings/company` | සමාගම් විස්තර, logo, ශාඛා, මුදල් වර්ගය |
| **Item** | `/pos/settings/item` | භාණ්ඩ සැකසීම්, UOM |
| **Inventory** | `/pos/settings/inventory` | තොග, costing, locations |
| **Order** | `/pos/settings/order` | POS හැසියර, hold, negative stock, offers |
| **Hardware** | `/pos/settings/hardware` | මුද්‍රකය, receipt, cash drawer |
| **Employee** | `/pos/settings/employee` | සේවක වාර්තා |
| **Email** | `/pos/settings/email` | ඊමේල් SMTP |
| **Notification** | `/pos/settings/notification` | විකිණීම්/ගෙවීම් දැනුම්දීම් |
| **Bank** | `/pos/settings/bank` | බැංකු ගිණුම් |
| **Alert** | `/pos/settings/alert` | Expiry, cheque අනතුරු ඇඟවීම |
| **Payment** | `/pos/settings/payment` | ගෙවීම් ක්‍රම |
| **Tax** | `/pos/settings/tax` | VAT අනුපාත |
| **Subscription** | `/pos/settings/subscription` | දායකත්වය |
| **API** | `/pos/settings/api` | API keys, webhooks |

### 17.2 Order Settings — වැදගත් සැකසීම්

| සැකසීම | අර්ථය |
|--------|--------|
| Allow sales for items with negative inventory | තොග 0 වූ විට විකිණීම |
| Allow delivery / service charge | බෙදාහැරීම් ගාස්තු |
| Allow offer | POS පිරිනැමීම් |
| Allow switching wholesale / retail prices | මිල මාරු කිරීම |
| Allow order discount | අතින් වට්ටම් |
| Allow editing of hold orders | Hold ඇණවුම් සංස්කරණය |
| Default payment method | පෙරනිමි ගෙවීම් ක්‍රමය |

සැකසීම් වෙනස් කළ පසු **Save** කර POS නැවත භාවිතා කරන්න.

### 17.3 Hardware Settings

- Receipt පළල (80mm / A4)
- Company header / logo
- මුද්‍රණයේ **Sky Smart Technologies** footer

---

## 18. පොදු ප්‍රශ්න

### POS හි භාණ්ඩය එක් කළ නොහැක — "Out of stock"

තොග 0 හෝ අවශ්‍ය ප්‍රමාණයට වඩා අඩුය. Purchasing හරහා තොග ලබා ගන්න. Negative inventory OFF ද බලන්න.

### Qty 0 නමුත් "Short 1 pcs" පෙන්වයි

අධික විකිණුම් — [10.2](#102-ඍණ--අධික-විකිණුම්-තොග-oversold) බලන්න.

### පිරිනැමීම් යෙදෙන්නේ නැත

Offers සක්‍රීය ද? Min order ළඟා වුණා ද? Retail/Wholesale ගැලපෙනවා ද?

### ලියපත මුද්‍රණය නොවේ

Hardware Settings → මුද්‍රකය සහ receipt සැකසීම් පරීක්ෂා කරන්න.

### Backend සම්බන්ධය නැත

`/pos/configure` → API URL නිවැරදි ද? සර්වර ක්‍රියාත්මක ද?

### මුදල් වාර්තාව නිවැරදි නැත

දින පරාසය සහ ශාඛාව පෙරහන් නිවැරදි ද? End of day වාර්තාව උත්සාහ කරන්න.

---

## ඉක්මන් යොමු කාඩ් — දිනපතා වැඩ

```
උදෑසන:  Dashboard → අඩු තොග / Hold orders පරීක්ෂා
විකිණීම: Sales → New → භාණ්ඩ → Checkout → ගෙවීම → Receipt
තොග:     Purchasing → New (ලැබීම්) | Inventory → Adjustment
ගෙවීම්:  Payments → Customer receipt
වාර්තා:  Reports → End of day / Sales summary
```

---

## ලේඛක හිමිකම්

**Sky Smart Technologies** — POS පරිශීලක අත්පොත (සිංහල)  
අනුවාදය 1.0 | 2026

තාක්ෂණික API ලේඛනය: `backend/API_DOCUMENTATION.md`  
ප්‍රසාරණය: `sky-sample-website-frontend/DEPLOY.md`

---

*Sky Smart Technologies — ඔබේ ව්‍යාපාරය සරල කරමු*
