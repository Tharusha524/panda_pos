import type { CompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import type { Item } from "../../../api/itemsApi";
import { printHtmlDocument } from "../../../utils/printReport";
import { expiryChipLabel, formatItemQty } from "./itemInventoryUtils";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRs(amount: number): string {
  return amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function printItemsTable(items: Item[], header: CompanyPrintHeader): void {
  const rowsHtml =
    items.length === 0
      ? `<tr><td colspan="9" style="text-align:center;color:#666;">No items</td></tr>`
      : items
          .map(
            (item) => `
        <tr>
          <td>${escapeHtml(item.item_number)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.category ?? "—")}</td>
          <td>${escapeHtml(item.sub_category ?? "—")}</td>
          <td>${escapeHtml((item.uom ?? "pcs").toUpperCase())}</td>
          <td style="text-align:right;">${escapeHtml(formatItemQty(item.qty ?? 0, item.uom))}</td>
          <td>${escapeHtml(
            (item.nearest_expiry_date ?? item.expiry_date)
              ? expiryChipLabel(item)
              : "—"
          )}</td>
          <td style="text-align:right;">${escapeHtml(formatRs(item.selling_price))}</td>
          <td>${item.is_active ? "Active" : "Inactive"}</td>
        </tr>`
          )
          .join("");

  const bodyHtml = `
    <p style="font-size:13px;color:#555;margin-bottom:12px;">
      Item master list. Item master can be used to create new batches or variants of an item.
    </p>
    <table>
      <thead>
        <tr>
          <th>Item Number</th>
          <th>Description</th>
          <th>Category</th>
          <th>Sub Category</th>
          <th>UOM</th>
          <th style="text-align:right;">Qty</th>
          <th>Expiry</th>
          <th style="text-align:right;">Selling Price (Rs)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="margin-top:16px;font-size:12px;color:#666;">Printed on ${new Date().toLocaleString()} — ${items.length} item(s)</p>
  `;

  printHtmlDocument({
    title: "Item List",
    header,
    reportTitle: "Item",
    bodyHtml,
  });
}

export function exportItemsCsv(items: Item[]): void {
  const headers = [
    "Item Number",
    "Description",
    "Category",
    "Sub Category",
    "UOM",
    "Qty",
    "Expiry",
    "Selling Price (Rs)",
    "Status",
    "Location",
  ];
  const rows = items.map((item) => [
    item.item_number,
    item.description,
    item.category ?? "",
    item.sub_category ?? "",
    (item.uom ?? "pcs").toUpperCase(),
    formatItemQty(item.qty ?? 0, item.uom),
    (item.nearest_expiry_date ?? item.expiry_date)
      ? expiryChipLabel(item)
      : "",
    item.selling_price.toFixed(2),
    item.status,
    item.location,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `items-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
