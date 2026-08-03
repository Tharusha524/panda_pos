import type { CompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import type { Supplier } from "../../../api/suppliersApi";
import { printHtmlDocument } from "../../../utils/printReport";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function printSupplierDetails(
  supplier: Supplier,
  header: CompanyPrintHeader
): void {
  const addressParts = [
    supplier.address_line1,
    supplier.address_line2,
    supplier.city,
    supplier.province,
    supplier.postal_code,
    supplier.country,
  ].filter(Boolean);

  const rows = [
    ["Supplier ID", supplier.supplier_code],
    ["Name", supplier.first_name],
    ["Phone", supplier.phone],
    ["Email", supplier.email || "—"],
    ["Opening Balance", formatRs(supplier.opening_balance)],
    ["Net Balance", formatRs(supplier.net_balance)],
    ["Address", addressParts.length ? addressParts.join(", ") : "—"],
  ];

  const bodyHtml = `
    <table>
      <tbody>
        ${rows
          .map(
            ([label, value]) =>
              `<tr><th style="width:180px;">${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#666;">Printed on ${new Date().toLocaleString()}</p>
  `;

  printHtmlDocument({
    title: `Supplier - ${supplier.first_name}`,
    header,
    reportTitle: "Supplier Details",
    bodyHtml,
  });
}

export function printSuppliersTable(
  suppliers: Supplier[],
  header: CompanyPrintHeader
): void {
  const totalBalance = suppliers.reduce((sum, s) => sum + s.net_balance, 0);

  const rowsHtml =
    suppliers.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#666;">No suppliers</td></tr>`
      : suppliers
          .map(
            (s) => `
        <tr>
          <td>${escapeHtml(s.supplier_code)}</td>
          <td>${escapeHtml(s.first_name)}</td>
          <td>${escapeHtml(s.phone)}</td>
          <td style="text-align:right;">${escapeHtml(formatRs(s.net_balance))}</td>
        </tr>`
          )
          .join("");

  const bodyHtml = `
    <table>
      <thead>
        <tr>
          <th>Supplier ID</th>
          <th>Name</th>
          <th>Number</th>
          <th style="text-align:right;">Net Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      ${
        suppliers.length > 0
          ? `<tfoot>
        <tr>
          <td colspan="3" style="font-weight:bold;text-align:right;">Total (${suppliers.length} suppliers)</td>
          <td style="font-weight:bold;text-align:right;">${escapeHtml(formatRs(totalBalance))}</td>
        </tr>
      </tfoot>`
          : ""
      }
    </table>
    <p style="margin-top:16px;font-size:12px;color:#666;">Printed on ${new Date().toLocaleString()}</p>
  `;

  printHtmlDocument({
    title: "Suppliers List",
    header,
    reportTitle: "Suppliers",
    bodyHtml,
  });
}
