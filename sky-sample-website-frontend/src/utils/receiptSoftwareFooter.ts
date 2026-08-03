/** Shown at the bottom of printed POS receipts (sales, purchases, etc.). */
export const RECEIPT_SOFTWARE_FOOTER = "Software provided by Sky Smart Technologies";

export function buildReceiptSoftwareFooterHtml(className = "print-software-footer"): string {
  const text = RECEIPT_SOFTWARE_FOOTER.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<div class="${className}">${text}</div>`;
}
