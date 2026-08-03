import {
  buildReceiptSoftwareFooterHtml,
  RECEIPT_SOFTWARE_FOOTER,
} from "./receiptSoftwareFooter";

describe("receiptSoftwareFooter", () => {
  test("exports footer text", () => {
    expect(RECEIPT_SOFTWARE_FOOTER).toContain("Sky Smart");
  });

  test("escapes HTML in footer", () => {
    const html = buildReceiptSoftwareFooterHtml("footer-class");
    expect(html).toContain('class="footer-class"');
    expect(html).not.toContain("<script");
  });
});
