import type { CompanyPrintHeader } from "../api/Settings/companySettingsApi";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintHeaderHtml(
  header: CompanyPrintHeader,
  reportTitle?: string
): string {
  const contact = [header.email, header.phone].filter(Boolean).join(" | ");
  const taxLine = [
    header.tax_id ? `Tax ID: ${header.tax_id}` : "",
    header.registration_number ? `Reg: ${header.registration_number}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const logoHtml = header.logo_url
    ? `<img src="${escapeHtml(header.logo_url)}" alt="Logo" style="height:72px;max-width:140px;object-fit:contain;" />`
    : "";

  return `
    <div class="print-header">
      <div class="print-header-inner">
        <div class="print-header-logo">${logoHtml}</div>
        <div class="print-header-info">
          <h1>${escapeHtml(header.company_name)}</h1>
          ${header.address_line ? `<p>${escapeHtml(header.address_line)}</p>` : ""}
          ${contact ? `<p class="print-header-contact">${escapeHtml(contact)}</p>` : ""}
          ${taxLine ? `<p class="print-header-tax">${escapeHtml(taxLine)}</p>` : ""}
        </div>
      </div>
      ${reportTitle ? `<p class="print-header-title">${escapeHtml(reportTitle)}</p>` : ""}
    </div>
  `;
}

const PRINT_STYLES = `
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    padding: 24px;
    color: #0f172a;
    background: #f8fafc;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-header {
    background: linear-gradient(135deg, #00327e 0%, #1e40af 100%);
    color: #fff;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 20px;
  }
  .print-header-inner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .print-header-logo img {
    height: 64px;
    max-width: 140px;
    object-fit: contain;
    background: #fff;
    border-radius: 8px;
    padding: 6px;
  }
  .print-header-info h1 { margin: 0 0 6px; font-size: 20px; font-weight: 700; }
  .print-header-info p { margin: 2px 0; font-size: 12px; opacity: 0.9; }
  .print-header-contact { opacity: 0.85; }
  .print-header-tax { font-size: 11px; opacity: 0.75; }
  .print-header-title {
    margin: 16px 0 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.9;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; background: #fff; border-radius: 8px; overflow: hidden; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
  th { background: #0f172a; color: #fff; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  @media print {
    body { background: #fff; padding: 12px; }
    .print-header { border-radius: 0; }
  }
`;

export function printHtmlDocument(options: {
  title: string;
  header: CompanyPrintHeader;
  bodyHtml: string;
  reportTitle?: string;
  extraStyles?: string;
}): void {
  const headerHtml = buildPrintHeaderHtml(options.header, options.reportTitle);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups to print this report.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(options.title)}</title>
        <style>${PRINT_STYLES}${options.extraStyles ?? ""}</style>
      </head>
      <body>
        ${headerHtml}
        ${options.bodyHtml}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

export function printElementById(options: {
  elementId: string;
  title: string;
  header: CompanyPrintHeader;
  reportTitle?: string;
}): void {
  const element = document.getElementById(options.elementId);
  if (!element) {
    return;
  }
  printHtmlDocument({
    title: options.title,
    header: options.header,
    bodyHtml: element.innerHTML,
    reportTitle: options.reportTitle,
  });
}
