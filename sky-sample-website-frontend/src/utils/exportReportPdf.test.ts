import type { ReportData, SalesSummarySale } from "../api/reportsApi";
import type { CompanyPrintHeader } from "../api/Settings/companySettingsApi";
import { buildReportBodyHtml, downloadReportAsPdf } from "./exportReportPdf";

jest.mock("./printReport", () => ({
  printHtmlDocument: jest.fn(),
}));

import { printHtmlDocument } from "./printReport";

describe("exportReportPdf", () => {
  const header: CompanyPrintHeader = {
    company_name: "Co",
    logo_url: null,
    address_line: "",
    email: "",
    phone: "",
    tax_id: "",
    registration_number: "",
  };

  const testSale = (overrides: Partial<SalesSummarySale> = {}): SalesSummarySale => ({
    id: 1,
    date: "2026-07-07",
    sales_id: "S1",
    customer: "Walk-in",
    location: "Main Location",
    transaction_label: "Sale",
    sub_total: 100,
    discount: 0,
    net_amount: 100,
    payment_method: "Cash",
    items: [],
    ...overrides,
  });

  const tableData: ReportData = {
    title: "Stock",
    layout: "table",
    generated_at: "2026-07-07",
    filters: { date_from: "2026-07-01", date_to: "2026-07-07", branch_id: null, branch_name: "Main" },
    columns: [{ key: "name", label: "Name" }],
    rows: [{ name: "Item" }],
    summary: [{ label: "Total", value: 10 }],
    note: "Note text",
    sales: [],
  };

  test("buildReportBodyHtml for table layout", () => {
    const html = buildReportBodyHtml(tableData);
    expect(html).toContain("Item");
    expect(html).toContain("Note text");
    expect(html).toContain("Total");
  });

  test("buildReportBodyHtml for sales summary layout", () => {
    const html = buildReportBodyHtml({
      ...tableData,
      layout: "sales_summary",
      sales: [
        testSale({
          sales_id: "S1",
          items: [
            {
              item_number: "A1",
              description: "Rice",
              qty: 1,
              unit_price: 100,
              discount: 0,
              net_price: 100,
              amount: 100,
            },
          ],
        }),
      ],
    });
    expect(html).toContain("S1");
    expect(html).toContain("Rice");
  });

  test("buildReportBodyHtml handles empty sales summary", () => {
    const html = buildReportBodyHtml({ ...tableData, layout: "sales_summary", sales: [] });
    expect(html).toContain("No sales");
  });

  test("buildReportBodyHtml handles empty table rows and numeric cells", () => {
    const html = buildReportBodyHtml({
      ...tableData,
      rows: [],
      summary: [],
      note: undefined,
    });
    expect(html).toContain("No data");
    const salesHtml = buildReportBodyHtml({
      ...tableData,
      layout: "sales_summary",
      sales: [
        testSale({
          sales_id: "S2",
          sub_total: 10,
          discount: 1.5,
          net_amount: 8.5,
        }),
      ],
    });
    expect(salesHtml).toContain("No items");
  });

  test("downloadReportAsPdf delegates to printHtmlDocument", () => {
    downloadReportAsPdf(header, tableData);
    expect(printHtmlDocument).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Stock", header })
    );
  });
});
