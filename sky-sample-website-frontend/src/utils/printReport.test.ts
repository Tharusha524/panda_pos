import type { CompanyPrintHeader } from "../api/Settings/companySettingsApi";
import { buildPrintHeaderHtml, printElementById, printHtmlDocument } from "./printReport";

const testHeader = (overrides: Partial<CompanyPrintHeader> = {}): CompanyPrintHeader => ({
  company_name: "Co",
  logo_url: null,
  address_line: "",
  email: "",
  phone: "",
  tax_id: "",
  registration_number: "",
  ...overrides,
});

describe("printReport", () => {
  test("buildPrintHeaderHtml escapes and includes fields", () => {
    const html = buildPrintHeaderHtml(
      {
        company_name: "Sky <POS>",
        address_line: "Colombo",
        email: "a@b.com",
        phone: "077",
        tax_id: "T1",
        registration_number: "R1",
        logo_url: "https://logo.test/x.png",
      },
      "Sales Report"
    );
    expect(html).toContain("Sky &lt;POS&gt;");
    expect(html).toContain("Sales Report");
    expect(html).toContain("Tax ID: T1");
    expect(html).toContain("logo.test");
  });

  test("buildPrintHeaderHtml without optional fields", () => {
    const html = buildPrintHeaderHtml(testHeader({ company_name: "Only Name" }));
    expect(html).toContain("Only Name");
    expect(html).not.toContain("print-header-title");
  });

  test("printHtmlDocument opens window and writes document", () => {
    const print = jest.fn();
    const write = jest.fn();
    const close = jest.fn();
    const focus = jest.fn();
    const win = { document: { write, close }, focus, print };
    jest.spyOn(window, "open").mockReturnValue(win as unknown as Window);
    jest.useFakeTimers();

    printHtmlDocument({
      title: "T",
      header: testHeader(),
      bodyHtml: "<p>Body</p>",
    });

    expect(write).toHaveBeenCalled();
    jest.runAllTimers();
    expect(print).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("printHtmlDocument alerts when popup blocked", () => {
    jest.spyOn(window, "open").mockReturnValue(null);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    printHtmlDocument({
      title: "T",
      header: testHeader(),
      bodyHtml: "",
    });
    expect(alertSpy).toHaveBeenCalled();
  });

  test("printElementById uses element html", () => {
    const el = document.createElement("div");
    el.id = "report-root";
    el.innerHTML = "<span>Rows</span>";
    document.body.appendChild(el);
    jest.spyOn(window, "open").mockReturnValue({
      document: { write: jest.fn(), close: jest.fn() },
      focus: jest.fn(),
      print: jest.fn(),
    } as unknown as Window);

    printElementById({
      elementId: "report-root",
      title: "R",
      header: testHeader(),
    });

    document.body.removeChild(el);
  });

  test("printElementById no-op when element missing", () => {
    const openSpy = jest.spyOn(window, "open");
    printElementById({
      elementId: "missing-id",
      title: "R",
      header: testHeader(),
    });
    expect(openSpy).not.toHaveBeenCalled();
  });
});
