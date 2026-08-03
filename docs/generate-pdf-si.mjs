/**
 * Generate POS_USER_MANUAL_SI.pdf from POS_USER_MANUAL_SI.md
 * Requires: npm install (in docs folder) — marked, puppeteer-core
 * Uses system Google Chrome (no Chromium download).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath = join(__dirname, "POS_USER_MANUAL_SI.md");
const pdfPath = join(__dirname, "POS_USER_MANUAL_SI.pdf");
const htmlPath = join(__dirname, "POS_USER_MANUAL_SI.print.html");

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findBrowser() {
  for (const p of CHROME_PATHS) {
    try {
      readFileSync(p);
      return p;
    } catch {
      /* try next */
    }
  }
  throw new Error("Chrome or Edge not found. Install Chrome or open POS_USER_MANUAL_SI.print.html and Print → Save as PDF.");
}

const md = readFileSync(mdPath, "utf8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sky POS — පරිශීලක අත්පොත</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Noto+Sans+Mono&display=swap" rel="stylesheet" />
  <style>
    :root {
      --text: #1a1a1a;
      --muted: #555;
      --border: #ddd;
      --accent: #1565c0;
      --bg-code: #f5f5f5;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Noto Sans Sinhala", "Iskoola Pota", sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: var(--text);
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm 15mm;
    }
    h1 {
      font-size: 22pt;
      color: var(--accent);
      border-bottom: 3px solid var(--accent);
      padding-bottom: 8px;
      margin-top: 0;
      page-break-after: avoid;
    }
    h2 {
      font-size: 15pt;
      color: var(--accent);
      margin-top: 1.4em;
      border-bottom: 1px solid var(--border);
      padding-bottom: 4px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12.5pt;
      margin-top: 1.1em;
      page-break-after: avoid;
    }
    p { margin: 0.5em 0; }
    ul, ol { margin: 0.4em 0; padding-left: 1.4em; }
    li { margin: 0.2em 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #e8f0fe; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    code, pre {
      font-family: "Noto Sans Mono", monospace;
      font-size: 9pt;
      background: var(--bg-code);
    }
    code { padding: 1px 4px; border-radius: 3px; }
    pre {
      padding: 10px 12px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      border: 1px solid var(--border);
    }
    hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
    strong { font-weight: 700; }
    a { color: var(--accent); text-decoration: none; }
    blockquote {
      margin: 0.8em 0;
      padding: 8px 12px;
      border-left: 4px solid var(--accent);
      background: #f0f7ff;
      color: var(--muted);
    }
    @media print {
      body { padding: 0; max-width: none; }
      h2 { page-break-before: auto; }
      a { color: inherit; }
    }
    .cover-note {
      text-align: center;
      color: var(--muted);
      font-size: 10pt;
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <p class="cover-note"><strong>Sky Smart Technologies</strong> — POS පරිශීලක අත්පොත (සිංහල)</p>
  ${body}
</body>
</html>`;

writeFileSync(htmlPath, html, "utf8");
console.log("Wrote:", htmlPath);

const executablePath = findBrowser();
console.log("Using browser:", executablePath);

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle0",
    timeout: 120000,
  });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 2000));

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="font-size:8px;width:100%;text-align:center;color:#888;font-family:sans-serif;padding:0 10mm;">Sky POS පරිශීලක අත්පොත — Sky Smart Technologies — <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });

  console.log("PDF created:", pdfPath);
} finally {
  await browser.close();
}
