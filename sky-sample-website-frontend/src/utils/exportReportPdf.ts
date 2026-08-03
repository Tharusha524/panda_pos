import type { CompanyPrintHeader } from "../api/Settings/companySettingsApi";
import type { ReportColumn, ReportData, ReportSummaryItem } from "../api/reportsApi";
import { printHtmlDocument } from "./printReport";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

function buildSummaryHtml(summary: ReportSummaryItem[]): string {
  if (!summary.length) return "";
  const rows = summary
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.label)}</td><td align="right">${escapeHtml(formatCell(s.value))}</td></tr>`
    )
    .join("");
  return `
    <h3 style="margin:16px 0 8px;font-size:14px;">Summary</h3>
    <table><tbody>${rows}</tbody></table>
  `;
}

function buildTableHtml(columns: ReportColumn[], rows: Record<string, unknown>[]): string {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${escapeHtml(formatCell(row[c.key]))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body || `<tr><td colspan="${columns.length}">No data for selected filters.</td></tr>`}</tbody>
    </table>
  `;
}

function buildSalesSummaryHtml(data: ReportData): string {
  const sales = data.sales ?? [];
  if (!sales.length) {
    return "<p>No sales for the selected period.</p>";
  }

  return sales
    .map((sale) => {
      const itemRows = sale.items
        .map(
          (line) =>
            `<tr>
              <td>${escapeHtml(String(line.item_number ?? ""))}</td>
              <td>${escapeHtml(String(line.description ?? ""))}</td>
              <td align="right">${formatCell(line.qty)}</td>
              <td align="right">${formatCell(line.unit_price)}</td>
              <td align="right">${formatCell(line.discount)}</td>
              <td align="right">${formatCell(line.net_price)}</td>
              <td align="right">${formatCell(line.amount)}</td>
            </tr>`
        )
        .join("");

      return `
        <div style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <table style="margin:0;">
            <tbody>
              <tr style="background:#f1f5f9;">
                <td><strong>Date</strong> ${escapeHtml(sale.date)}</td>
                <td><strong>Sales ID</strong> ${escapeHtml(String(sale.sales_id ?? ""))}</td>
                <td align="right"><strong>Sub Total</strong> ${formatCell(sale.sub_total)}</td>
                <td align="right"><strong>Discount</strong> ${formatCell(sale.discount)}</td>
                <td align="right"><strong>Net</strong> ${formatCell(sale.net_amount)}</td>
              </tr>
            </tbody>
          </table>
          <table style="margin:0;">
            <thead>
              <tr>
                <th>Item No</th><th>Description</th><th>Qty</th><th>Price</th><th>Dis</th><th>Net Price</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows || "<tr><td colspan='7'>No items</td></tr>"}</tbody>
          </table>
        </div>
      `;
    })
    .join("");
}

export function buildReportBodyHtml(data: ReportData): string {
  const filters = data.filters;
  const filterLines = [
    `Period: ${filters.date_from} to ${filters.date_to}`,
    `Branch: ${filters.branch_name ?? "All branches"}`,
    `Generated: ${data.generated_at}`,
  ]
    .map((line) => `<p style="margin:4px 0;font-size:12px;color:#475569;">${escapeHtml(line)}</p>`)
    .join("");

  const note = data.note
    ? `<p style="margin:12px 0;padding:8px 12px;background:#fff7ed;border-radius:6px;font-size:12px;">${escapeHtml(data.note)}</p>`
    : "";

  const body =
    data.layout === "sales_summary"
      ? buildSalesSummaryHtml(data)
      : buildTableHtml(data.columns, data.rows);

  return `
    ${filterLines}
    ${buildSummaryHtml(data.summary)}
    ${note}
    ${body}
  `;
}

/** Opens print dialog — use Save as PDF in the browser to download. */
export function downloadReportAsPdf(header: CompanyPrintHeader, data: ReportData): void {
  printHtmlDocument({
    title: data.title,
    header,
    reportTitle: data.title,
    bodyHtml: buildReportBodyHtml(data),
  });
}
