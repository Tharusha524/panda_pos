import type { CompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import type {
  HardwareSettings,
  LetterheadMargin,
  PrintingPaperSize,
  SalesReceiptStyle,
} from "../../../api/Settings/hardwareSettingsApi";
import type {
  SaleReceiptApiPayload,
  SaleReceiptLabels,
  SaleReceiptLine,
} from "../../../api/salesApi";
import { buildReceiptSoftwareFooterHtml } from "../../../utils/receiptSoftwareFooter";
import { formatSaleRs } from "./saleFormUtils";

export type { SaleReceiptApiPayload, SaleReceiptLabels, SaleReceiptLine };

export interface SaleReceiptData {
  sales_id: string;
  sale_date: string;
  customer_name?: string | null;
  location: string;
  payment_method: string;
  sub_total: number;
  discount: number;
  service_charge?: number;
  card_payment_charge?: number;
  net_amount: number;
  amount_received?: number | null;
  bank_name?: string | null;
  cheque_number?: string | null;
  lines: SaleReceiptLine[];
  show_barcode?: boolean;
  barcode_value?: string | null;
  discount_label?: string | null;
}

export interface SaleReceiptPrintOptions {
  printing_paper_size?: PrintingPaperSize;
  sales_receipt_printout_style?: SalesReceiptStyle;
  letterhead_top_margin_cm?: LetterheadMargin;
  logo_url?: string | null;
  allow_logo_on_sales_receipt?: boolean;
}

const DEFAULT_LABELS: SaleReceiptLabels = {
  receipt_title: "TAX INVOICE",
  sales_id: "Invoice No",
  date: "Date",
  location: "Branch",
  customer: "Bill To",
  item_no: "SKU",
  description: "Description",
  qty: "Qty",
  uom: "UOM",
  unit_price: "Rate",
  total: "Amount",
  sub_total: "Subtotal",
  discount: "Discount",
  service_charge: "Delivery charge",
  card_charge: "Card fee",
  net_amount: "Total due",
  payment: "Payment",
  received: "Paid",
  change: "Change",
  thank_you: "Thank you for your business",
};

const INK = "#111111";
const MUTED = "#444444";

/** Letterhead top gap is for pre-printed A4/A5/Letter stock — not 80mm thermal rolls. */
function resolveReceiptTopMargin(
  paperSize: PrintingPaperSize | undefined,
  margin: LetterheadMargin
): string {
  if ((paperSize ?? "a4") === "80mm" || margin === "none") {
    return "0";
  }
  return `${margin}cm`;
}

export function buildSaleReceiptHtmlFromApi(payload: SaleReceiptApiPayload): string {
  const header: CompanyPrintHeader = {
    company_name: payload.header.company_name,
    address_line: payload.header.address_line ?? "",
    phone: payload.header.phone ?? "",
    email: payload.header.email ?? "",
    tax_id: payload.header.tax_id ?? null,
    registration_number: payload.header.registration_number ?? null,
    logo_url:
      payload.print_options.allow_logo_on_sales_receipt !== false
        ? payload.print_options.logo_url ?? payload.header.logo_url ?? null
        : null,
  };

  return buildSaleReceiptHtml(header, payload.sale, {
    labels: payload.labels,
    hardware: payload.hardware_settings,
    options: {
      printing_paper_size: payload.print_options.printing_paper_size as PrintingPaperSize,
      sales_receipt_printout_style: payload.print_options
        .sales_receipt_printout_style as SalesReceiptStyle,
      letterhead_top_margin_cm: payload.print_options.letterhead_top_margin_cm as LetterheadMargin,
      logo_url: payload.print_options.logo_url,
      allow_logo_on_sales_receipt: payload.print_options.allow_logo_on_sales_receipt,
    },
  });
}

export function printSaleReceiptFromApi(payload: SaleReceiptApiPayload): void {
  const html = buildSaleReceiptHtmlFromApi(payload);
  const isThermal = payload.print_options.printing_paper_size === "80mm";
  openPrintWindow(html, `Invoice ${payload.sale.sales_id}`, isThermal);
}

function buildSaleReceiptHtml(
  header: CompanyPrintHeader,
  sale: SaleReceiptData,
  extras?: {
    labels?: Partial<SaleReceiptLabels>;
    options?: SaleReceiptPrintOptions;
    hardware?: HardwareSettings;
  }
): string {
  const hw = extras?.hardware;
  const labels = { ...DEFAULT_LABELS, ...extras?.labels };
  const options: SaleReceiptPrintOptions = {
    printing_paper_size: hw?.printing_paper_size ?? extras?.options?.printing_paper_size ?? "a4",
    sales_receipt_printout_style:
      hw?.sales_receipt_printout_style ?? extras?.options?.sales_receipt_printout_style ?? "style_4",
    letterhead_top_margin_cm:
      hw?.letterhead_top_margin_cm ?? extras?.options?.letterhead_top_margin_cm ?? "none",
    logo_url:
      hw && !hw.allow_logo_on_sales_receipt
        ? null
        : (extras?.options?.logo_url ??
          (hw?.printing_paper_size === "80mm" ? hw.logo_80mm_url : hw?.logo_a4_a5_url) ??
          header.logo_url),
    allow_logo_on_sales_receipt:
      hw?.allow_logo_on_sales_receipt ?? extras?.options?.allow_logo_on_sales_receipt ?? true,
  };

  let saleData = { ...sale };
  if (hw) {
    if (!hw.allow_customer_details_on_sales_receipt) {
      saleData = { ...saleData, customer_name: null };
    }
    if (!hw.allow_discount_on_sales_receipt) {
      saleData = { ...saleData, discount: 0, discount_label: null };
    } else if (!saleData.discount_label) {
      saleData = { ...saleData, discount_label: hw.customize_label_for_discount || "Discount" };
    }
    if (!hw.show_barcode_on_sales_receipt) {
      saleData = { ...saleData, show_barcode: false };
    } else {
      saleData = { ...saleData, show_barcode: true, barcode_value: saleData.sales_id };
    }
  }

  const resolvedHeader: CompanyPrintHeader = {
    ...header,
    logo_url: options.allow_logo_on_sales_receipt ? options.logo_url ?? header.logo_url : null,
  };

  const style = options.sales_receipt_printout_style ?? "style_4";
  const isThermal = (options.printing_paper_size ?? "a4") === "80mm";
  if (isThermal) {
    return buildThermalReceiptDocument(resolvedHeader, saleData, labels, options);
  }
  return buildA4ReceiptDocument(resolvedHeader, saleData, labels, style, options);
}

export function printSaleReceipt(
  header: CompanyPrintHeader,
  sale: SaleReceiptData,
  extras?: {
    labels?: Partial<SaleReceiptLabels>;
    options?: SaleReceiptPrintOptions;
    hardware?: HardwareSettings;
  }
): void {
  const html = buildSaleReceiptHtml(header, sale, extras);
  const isThermal =
    (extras?.hardware?.printing_paper_size ?? extras?.options?.printing_paper_size ?? "a4") ===
    "80mm";
  openPrintWindow(html, `Invoice ${sale.sales_id}`, isThermal);
}

function buildThermalReceiptDocument(
  header: CompanyPrintHeader,
  sale: SaleReceiptData,
  labels: SaleReceiptLabels,
  options: SaleReceiptPrintOptions
): string {
  const change =
    sale.amount_received != null ? Math.max(0, sale.amount_received - sale.net_amount) : null;
  const discountLabel = sale.discount_label ?? labels.discount;
  const showDiscount = sale.discount > 0 || sale.discount_label != null;
  const customerName = sale.customer_name ?? "Walk-in";

  const contactLine = [header.phone, header.email].filter(Boolean).join(" · ");
  const taxLine = [
    header.tax_id ? `Tax: ${header.tax_id}` : "",
    header.registration_number ? `Reg: ${header.registration_number}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const logoHtml = header.logo_url
    ? `<img class="rcpt-logo" src="${escape(header.logo_url)}" alt="" />`
    : "";

  const itemBlocks = sale.lines
    .map((line) => {
      const uomSuffix = line.uom ? ` (${escape(line.uom)})` : "";
      return `
      <div class="rcpt-item">
        <div class="rcpt-item-name">${escape(line.description)}${uomSuffix}</div>
        <div class="rcpt-item-detail">
          <span>${line.qty} × ${formatSaleRs(line.unit_price)}</span>
          <span class="rcpt-item-amt">${formatSaleRs(line.line_total)}</span>
        </div>
      </div>`;
    })
    .join("");

  const totalLines = [
    `<div class="rcpt-row"><span>${escape(labels.sub_total)}</span><span>${formatSaleRs(sale.sub_total)}</span></div>`,
    showDiscount
      ? `<div class="rcpt-row"><span>${escape(discountLabel)}</span><span>- ${formatSaleRs(sale.discount)}</span></div>`
      : "",
    (sale.service_charge ?? 0) > 0
      ? `<div class="rcpt-row"><span>${escape(labels.service_charge)}</span><span>${formatSaleRs(sale.service_charge!)}</span></div>`
      : "",
    (sale.card_payment_charge ?? 0) > 0
      ? `<div class="rcpt-row"><span>${escape(labels.card_charge)}</span><span>${formatSaleRs(sale.card_payment_charge!)}</span></div>`
      : "",
    `<div class="rcpt-row rcpt-row-grand"><span>${escape(labels.net_amount)}</span><span>${formatSaleRs(sale.net_amount)}</span></div>`,
    `<div class="rcpt-row"><span>${escape(labels.payment)}</span><span>${escape(sale.payment_method)}</span></div>`,
    sale.amount_received != null
      ? `<div class="rcpt-row"><span>${escape(labels.received)}</span><span>${formatSaleRs(sale.amount_received)}</span></div>`
      : "",
    change != null && change > 0
      ? `<div class="rcpt-row"><span>${escape(labels.change)}</span><span>${formatSaleRs(change)}</span></div>`
      : "",
    sale.cheque_number
      ? `<div class="rcpt-row rcpt-row-note"><span>Cheque</span><span>${escape(sale.cheque_number)}</span></div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const barcodeHtml =
    sale.show_barcode && sale.barcode_value
      ? `<div class="rcpt-barcode">
          <div class="rcpt-barcode-bars"></div>
          <div class="rcpt-barcode-no">${escape(sale.barcode_value)}</div>
        </div>`
      : "";

  const margin = options.letterhead_top_margin_cm ?? "none";
  const marginTop = resolveReceiptTopMargin(options.printing_paper_size, margin);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=80mm" />
  <title>${escape(sale.sales_id)}</title>
  <style>${buildThermalReceiptStyles(marginTop)}</style>
</head>
<body>
  <div class="rcpt">
    ${logoHtml}
    <div class="rcpt-store">${escape(header.company_name)}</div>
    ${header.address_line ? `<div class="rcpt-sub">${escape(header.address_line)}</div>` : ""}
    ${contactLine ? `<div class="rcpt-sub">${escape(contactLine)}</div>` : ""}
    ${taxLine ? `<div class="rcpt-sub rcpt-tax">${escape(taxLine)}</div>` : ""}

    <div class="rcpt-rule"></div>

    <div class="rcpt-title">${escape(labels.receipt_title)}</div>
    <div class="rcpt-inv-no">${escape(sale.sales_id)}</div>

    <div class="rcpt-rule rcpt-rule-light"></div>

    <div class="rcpt-info">
      <div class="rcpt-row"><span>${escape(labels.date)}</span><span>${escape(sale.sale_date)}</span></div>
      <div class="rcpt-row"><span>${escape(labels.location)}</span><span>${escape(sale.location)}</span></div>
      <div class="rcpt-row"><span>${escape(labels.customer)}</span><span>${escape(customerName)}</span></div>
    </div>

    <div class="rcpt-rule"></div>

    <div class="rcpt-items">
      ${itemBlocks || `<div class="rcpt-empty">No items</div>`}
    </div>

    <div class="rcpt-rule"></div>

    <div class="rcpt-totals">${totalLines}</div>

    <div class="rcpt-rule rcpt-rule-double"></div>

    <div class="rcpt-thanks">${escape(labels.thank_you)}</div>
    <div class="rcpt-foot">${escape(new Date().toLocaleString())}</div>
    ${barcodeHtml}
    ${buildReceiptSoftwareFooterHtml("rcpt-software")}
  </div>
</body>
</html>`;
}

function buildThermalReceiptStyles(marginTop: string): string {
  return `
    @page { size: 80mm auto; margin: 2mm 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 0;
      padding-top: ${marginTop};
      background: #fff;
      color: #000;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .rcpt {
      width: 100%;
      max-width: 74mm;
      margin: 0 auto;
      padding: 4mm 2mm 6mm;
    }
    .rcpt-logo {
      display: block;
      max-width: 36mm;
      max-height: 14mm;
      margin: 0 auto 3mm;
      object-fit: contain;
    }
    .rcpt-store {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1.25;
      word-wrap: break-word;
    }
    .rcpt-sub {
      text-align: center;
      font-size: 10px;
      color: #333;
      margin-top: 2px;
      line-height: 1.35;
      word-wrap: break-word;
    }
    .rcpt-tax { font-size: 9px; }
    .rcpt-rule {
      border: none;
      border-top: 1px dashed #000;
      margin: 3mm 0;
    }
    .rcpt-rule-light { border-top-style: dotted; opacity: 0.7; }
    .rcpt-rule-double {
      border-top: 2px solid #000;
      border-style: solid;
      margin-top: 4mm;
    }
    .rcpt-title {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .rcpt-inv-no {
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      font-family: "Courier New", Courier, monospace;
      margin-top: 1mm;
      letter-spacing: 0.05em;
    }
    .rcpt-info, .rcpt-totals { font-size: 11px; }
    .rcpt-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 2mm;
      padding: 1mm 0;
    }
    .rcpt-row span:first-child {
      color: #444;
      flex-shrink: 0;
    }
    .rcpt-row span:last-child {
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .rcpt-items { margin: 1mm 0; }
    .rcpt-item {
      padding: 2mm 0;
      border-bottom: 1px dotted #ccc;
    }
    .rcpt-item:last-child { border-bottom: none; }
    .rcpt-item-name {
      font-weight: 600;
      font-size: 11px;
      line-height: 1.3;
      word-wrap: break-word;
      margin-bottom: 1mm;
    }
    .rcpt-item-detail {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #333;
    }
    .rcpt-item-amt {
      font-weight: 700;
      font-size: 11px;
      color: #000;
    }
    .rcpt-empty {
      text-align: center;
      color: #666;
      padding: 3mm 0;
      font-size: 11px;
    }
    .rcpt-row-grand {
      margin-top: 2mm;
      padding-top: 2mm;
      border-top: 1px solid #000;
      font-size: 13px;
    }
    .rcpt-row-grand span:last-child {
      font-size: 15px;
      font-weight: 800;
    }
    .rcpt-row-note { font-size: 10px; }
    .rcpt-thanks {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      margin: 3mm 0 2mm;
    }
    .rcpt-foot {
      text-align: center;
      font-size: 9px;
      color: #555;
    }
    .rcpt-software {
      text-align: center;
      font-size: 9px;
      color: #333;
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px dotted #999;
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1.35;
    }
    .rcpt-barcode {
      margin-top: 4mm;
      text-align: center;
    }
    .rcpt-barcode-bars {
      height: 10mm;
      width: 90%;
      max-width: 60mm;
      margin: 0 auto;
      background: repeating-linear-gradient(
        90deg,
        #000 0 1.5px, transparent 1.5px 3px,
        #000 3px 4px, transparent 4px 6px
      );
    }
    .rcpt-barcode-no {
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
      letter-spacing: 0.08em;
      margin-top: 1mm;
    }
    @media print {
      html, body { width: 80mm; padding: 0; padding-top: ${marginTop}; }
      .rcpt { max-width: 100%; padding: 2mm 1mm; }
    }
  `;
}

function buildA4ReceiptDocument(
  header: CompanyPrintHeader,
  sale: SaleReceiptData,
  labels: SaleReceiptLabels,
  style: SalesReceiptStyle,
  options: SaleReceiptPrintOptions
): string {  const change =
    sale.amount_received != null ? Math.max(0, sale.amount_received - sale.net_amount) : null;
  const showUom = sale.lines.some((l) => l.uom);
  const discountLabel = sale.discount_label ?? labels.discount;
  const showDiscount = sale.discount > 0 || sale.discount_label != null;

  const contactParts = [header.phone, header.email].filter(Boolean);
  const taxParts = [
    header.tax_id ? `Tax ID: ${header.tax_id}` : "",
    header.registration_number ? `Reg: ${header.registration_number}` : "",
  ].filter(Boolean);

  const logoHtml = header.logo_url
    ? `<img class="inv-logo" src="${escape(header.logo_url)}" alt="" />`
    : `<div class="inv-logo-placeholder">${escape(header.company_name.charAt(0))}</div>`;

  const lineRows = sale.lines
    .map(
      (line, i) => `
      <tr>
        <td class="col-num">${i + 1}</td>
        <td class="col-sku">${escape(line.item_number ?? "—")}</td>
        <td class="col-desc">
          <span class="line-name">${escape(line.description)}</span>
          ${showUom && line.uom ? `<span class="line-uom">${escape(line.uom)}</span>` : ""}
        </td>
        ${showUom ? `<td class="col-uom col-uom-cell">${escape(line.uom ?? "—")}</td>` : ""}
        <td class="col-qty">${line.qty}</td>
        <td class="col-rate">${formatSaleRs(line.unit_price)}</td>
        <td class="col-amt">${formatSaleRs(line.line_total)}</td>
      </tr>`
    )
    .join("");

  const barcodeHtml =
    sale.show_barcode && sale.barcode_value
      ? `<div class="inv-barcode">
          <div class="inv-barcode-bars" aria-hidden="true"></div>
          <span class="inv-barcode-text">${escape(sale.barcode_value)}</span>
        </div>`
      : "";

  const totalRows = [
    `<div class="inv-total-row"><span>${escape(labels.sub_total)}</span><span>${formatSaleRs(sale.sub_total)}</span></div>`,
    showDiscount
      ? `<div class="inv-total-row inv-total-discount"><span>${escape(discountLabel)}</span><span>− ${formatSaleRs(sale.discount)}</span></div>`
      : "",
    (sale.service_charge ?? 0) > 0
      ? `<div class="inv-total-row"><span>${escape(labels.service_charge)}</span><span>${formatSaleRs(sale.service_charge!)}</span></div>`
      : "",
    (sale.card_payment_charge ?? 0) > 0
      ? `<div class="inv-total-row"><span>${escape(labels.card_charge)}</span><span>${formatSaleRs(sale.card_payment_charge!)}</span></div>`
      : "",
    `<div class="inv-total-row inv-total-grand"><span>${escape(labels.net_amount)}</span><span>${formatSaleRs(sale.net_amount)}</span></div>`,
    sale.amount_received != null
      ? `<div class="inv-total-row"><span>${escape(labels.received)}</span><span>${formatSaleRs(sale.amount_received)}</span></div>`
      : "",
    change != null && change > 0
      ? `<div class="inv-total-row"><span>${escape(labels.change)}</span><span>${formatSaleRs(change)}</span></div>`
      : "",
    sale.cheque_number
      ? `<div class="inv-total-row inv-total-note"><span>Cheque</span><span>${escape(sale.cheque_number)}${sale.bank_name ? ` · ${escape(sale.bank_name)}` : ""}</span></div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const customerName = sale.customer_name ? escape(sale.customer_name) : "Walk-in customer";
  const itemCount = sale.lines.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escape(sale.sales_id)}</title>
  <style>${buildA4ReceiptStyles(options, style)}</style>
</head>
<body class="inv-body inv-${style} inv-a4">
  <article class="inv-sheet">
    <div class="inv-accent-bar" aria-hidden="true"></div>

    <header class="inv-header">
      <div class="inv-brand">
        ${logoHtml}
        <div class="inv-brand-text">
          <h1>${escape(header.company_name)}</h1>
          ${header.address_line ? `<p class="inv-address">${escape(header.address_line)}</p>` : ""}
          ${contactParts.length ? `<p class="inv-contact">${contactParts.map(escape).join(" · ")}</p>` : ""}
          ${taxParts.length ? `<p class="inv-tax">${taxParts.map(escape).join(" · ")}</p>` : ""}
        </div>
      </div>
      <div class="inv-invoice-box">
        <p class="inv-doc-type">${escape(labels.receipt_title)}</p>
        <p class="inv-doc-id">${escape(sale.sales_id)}</p>
        <dl class="inv-invoice-mini">
          <div><dt>${escape(labels.date)}</dt><dd>${escape(sale.sale_date)}</dd></div>
          <div><dt>${escape(labels.payment)}</dt><dd>${escape(sale.payment_method)}</dd></div>
        </dl>
        ${barcodeHtml}
      </div>
    </header>

    <section class="inv-details-grid">
      <div class="inv-detail-card">
        <h2 class="inv-card-title">${escape(labels.customer)}</h2>
        <p class="inv-card-value">${customerName}</p>
        <p class="inv-card-sub"><span>${escape(labels.location)}:</span> ${escape(sale.location)}</p>
      </div>
      <div class="inv-detail-card inv-detail-summary">
        <h2 class="inv-card-title">Summary</h2>
        <dl class="inv-summary-list">
          <div><dt>${escape(labels.sales_id)}</dt><dd>${escape(sale.sales_id)}</dd></div>
          <div><dt>Items</dt><dd>${itemCount}</dd></div>
          <div><dt>${escape(labels.net_amount)}</dt><dd class="inv-summary-total">${formatSaleRs(sale.net_amount)}</dd></div>
        </dl>
      </div>
    </section>

    <div class="inv-table-wrap">
      <table class="inv-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-sku">${escape(labels.item_no)}</th>
            <th>${escape(labels.description)}</th>
            ${showUom ? `<th class="col-uom-cell">${escape(labels.uom)}</th>` : ""}
            <th class="th-right col-qty">${escape(labels.qty)}</th>
            <th class="th-right col-rate">${escape(labels.unit_price)}</th>
            <th class="th-right col-amt">${escape(labels.total)}</th>
          </tr>
        </thead>
        <tbody>${lineRows || `<tr><td colspan="${showUom ? 7 : 6}" class="inv-empty">No items</td></tr>`}</tbody>
      </table>
    </div>

    <div class="inv-bottom">
      <div class="inv-bottom-left">
        <p class="inv-terms-title">Payment &amp; notes</p>
        <p class="inv-terms-text">
          ${escape(labels.payment)}: <strong>${escape(sale.payment_method)}</strong>
          ${sale.cheque_number ? `<br/>Cheque: ${escape(sale.cheque_number)}${sale.bank_name ? ` (${escape(sale.bank_name)})` : ""}` : ""}
        </p>
        <p class="inv-thanks">${escape(labels.thank_you)}</p>
      </div>
      <div class="inv-totals-panel">
        <div class="inv-totals-head">Amount summary</div>
        <div class="inv-totals-body">
          ${totalRows}
        </div>
      </div>
    </div>

    <footer class="inv-footer-pro">
      <span>${escape(header.company_name)}</span>
      <span class="inv-footer-dot">·</span>
      <span>${escape(new Date().toLocaleString())}</span>
    </footer>
    ${buildReceiptSoftwareFooterHtml("inv-software-foot")}
  </article>
</body>
</html>`;
}

function buildA4ReceiptStyles(options: SaleReceiptPrintOptions, _style: SalesReceiptStyle): string {
  const paper = options.printing_paper_size ?? "a4";
  const margin = options.letterhead_top_margin_cm ?? "none";
  const marginTop = resolveReceiptTopMargin(options.printing_paper_size, margin);
  const pageSize = paper === "a5" ? "A5" : paper === "letter" ? "letter" : "A4";

  const sans = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
  const serif = 'Georgia, "Times New Roman", Times, serif';
  const mono = '"Consolas", "Courier New", Courier, monospace';

  return `
    @page { size: ${pageSize}; margin: 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body.inv-body {
      margin: 0;
      padding: 12px;
      padding-top: ${marginTop === "0" ? "12px" : `calc(12px + ${marginTop})`};
      font-family: ${sans};
      font-size: 13px;
      line-height: 1.5;
      color: ${INK};
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .inv-sheet {
      max-width: 720px;
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e8e8e8;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .inv-accent-bar { height: 4px; background: ${INK}; }
    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      padding: 24px 28px 20px;
      border-bottom: 1px solid #e8e8e8;
    }
    .inv-brand { display: flex; gap: 14px; align-items: flex-start; flex: 1; min-width: 0; }
    .inv-logo { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
    .inv-logo-placeholder {
      width: 64px; height: 64px; border: 2px solid ${INK};
      display: flex; align-items: center; justify-content: center;
      font-family: ${serif}; font-size: 22px; font-weight: 700; flex-shrink: 0;
    }
    .inv-brand-text h1 {
      font-family: ${serif}; font-size: 22px; font-weight: 700;
      letter-spacing: 0.01em; line-height: 1.2; margin-bottom: 6px; color: ${INK};
    }
    .inv-brand-text p { font-size: 11.5px; color: ${MUTED}; line-height: 1.45; margin-top: 2px; }
    .inv-invoice-box {
      flex-shrink: 0; min-width: 200px; text-align: right;
      padding: 12px 16px; border: 1px solid ${INK}; background: #fafafa;
    }
    .inv-doc-type {
      font-size: 9px; font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase; color: ${MUTED};
    }
    .inv-doc-id {
      margin: 4px 0 8px; font-size: 20px; font-weight: 700;
      font-family: ${mono}; letter-spacing: 0.03em; color: ${INK};
    }
    .inv-invoice-mini { font-size: 10px; color: ${MUTED}; }
    .inv-invoice-mini div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 3px; }
    .inv-invoice-mini dt { font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 8px; }
    .inv-invoice-mini dd { color: ${INK}; font-weight: 600; }
    .inv-barcode { margin-top: 10px; text-align: right; }
    .inv-barcode-bars {
      height: 24px; width: 110px; margin-left: auto;
      background: repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 8px);
    }
    .inv-barcode-text { display: block; margin-top: 3px; font-size: 9px; font-family: ${mono}; letter-spacing: 0.06em; }
    .inv-details-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      padding: 20px 28px; background: #ffffff; border-bottom: 1px solid #e8e8e8;
    }
    .inv-detail-card { border: 1px solid #e8e8e8; padding: 14px 16px; background: #ffffff; }
    .inv-card-title {
      font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: ${MUTED}; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e8e8e8;
    }
    .inv-card-value { font-size: 15px; font-weight: 600; color: ${INK}; margin-bottom: 4px; }
    .inv-card-sub { font-size: 11px; color: ${MUTED}; }
    .inv-card-sub span { font-weight: 600; }
    .inv-summary-list { font-size: 11px; }
    .inv-summary-list div {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 4px 0; border-bottom: 1px dotted #e8e8e8;
    }
    .inv-summary-list div:last-child { border-bottom: none; }
    .inv-summary-list dt { color: ${MUTED}; font-weight: 500; }
    .inv-summary-list dd { color: ${INK}; font-weight: 600; text-align: right; }
    .inv-summary-total { font-size: 14px !important; font-weight: 700 !important; }
    .inv-table-wrap { padding: 16px 28px 8px; }
    .inv-table {
      width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e8e8e8;
    }
    .inv-table thead th {
      background: #f5f5f5; color: ${INK}; font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.07em;
      padding: 10px 8px; text-align: left; border-bottom: 2px solid ${INK};
    }
    .inv-table thead th.th-right { text-align: right; }
    .inv-table tbody td {
      padding: 10px 8px; border-bottom: 1px solid #eeeeee; vertical-align: top; color: ${INK};
    }
    .inv-table tbody tr:last-child td { border-bottom: none; }
    .col-num { width: 28px; text-align: center; color: ${MUTED}; font-size: 10px; }
    .col-sku { font-family: ${mono}; font-size: 10px; color: ${MUTED}; max-width: 80px; word-break: break-all; }
    .col-desc { font-weight: 500; }
    .line-name { display: block; }
    .line-uom { display: none; }
    .col-uom-cell { text-transform: lowercase; color: ${MUTED}; font-size: 10px; }
    .col-qty, .col-rate, .col-amt { text-align: right; white-space: nowrap; }
    .col-amt { font-weight: 700; }
    .inv-empty { text-align: center; color: ${MUTED}; padding: 16px !important; }
    .inv-bottom {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 20px; padding: 12px 28px 20px; flex-wrap: wrap;
    }
    .inv-bottom-left { flex: 1; min-width: 180px; }
    .inv-terms-title {
      font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: ${MUTED}; margin-bottom: 6px;
    }
    .inv-terms-text { font-size: 11px; color: ${MUTED}; line-height: 1.55; margin-bottom: 12px; }
    .inv-terms-text strong { color: ${INK}; }
    .inv-thanks { font-size: 12px; font-weight: 600; font-style: italic; color: ${INK}; margin-top: 8px; }
    .inv-totals-panel { width: 100%; max-width: 300px; border: 2px solid ${INK}; flex-shrink: 0; }
    .inv-totals-head {
      background: ${INK}; color: #ffffff; font-size: 9px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 14px;
    }
    .inv-totals-body { padding: 10px 14px 12px; background: #ffffff; }
    .inv-total-row {
      display: flex; justify-content: space-between; gap: 16px;
      padding: 5px 0; font-size: 12px; color: ${MUTED}; border-bottom: 1px dotted #e8e8e8;
    }
    .inv-total-row:last-child { border-bottom: none; }
    .inv-total-row span:last-child { font-weight: 600; color: ${INK}; text-align: right; min-width: 90px; }
    .inv-total-grand {
      margin-top: 4px; padding-top: 10px; border-top: 2px solid ${INK};
      font-size: 13px; color: ${INK};
    }
    .inv-total-grand span:first-child { font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .inv-total-grand span:last-child { font-size: 18px; font-weight: 800; font-family: ${mono}; }
    .inv-total-note { font-size: 10px; }
    .inv-footer-pro {
      display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 6px;
      padding: 10px 16px; border-top: 1px solid #e8e8e8; background: #fafafa;
      font-size: 9px; color: ${MUTED}; letter-spacing: 0.02em;
    }
    .inv-footer-dot { opacity: 0.5; }
    .inv-software-foot {
      text-align: center;
      padding: 8px 16px 14px;
      font-size: 9px;
      color: ${MUTED};
      border-top: 1px dashed #e0e0e0;
      background: #fafafa;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    @media print {
      body.inv-body { padding: 0; padding-top: ${marginTop}; background: #fff; }
      .inv-sheet { box-shadow: none; border: none; }
      .inv-totals-head { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .inv-accent-bar { background: #000 !important; }
    }
  `;
}

function openPrintWindow(html: string, title: string, isThermal = false): void {
  const win = window.open("", "_blank", isThermal ? "width=360,height=720" : "width=920,height=800");
  if (!win) {
    alert("Please allow pop-ups to print this invoice.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
