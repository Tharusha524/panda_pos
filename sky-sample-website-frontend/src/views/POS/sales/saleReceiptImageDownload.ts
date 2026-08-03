import type { SaleReceiptApiPayload } from "../../../api/salesApi";
import { getApiBaseUrl } from "../../../config/apiBase";
import { buildSaleReceiptHtmlFromApi } from "./saleReceiptPrint";

/**
 * Render receipt HTML off-screen and download as PNG.
 */
export async function downloadSaleReceiptImageFromApi(
  payload: SaleReceiptApiPayload
): Promise<void> {
  const html = buildSaleReceiptHtmlFromApi(payload);
  const { default: html2canvas } = await import("html2canvas");

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "800px";
  host.style.background = "#fff";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  host.innerHTML = html;
  document.body.appendChild(host);

  const target =
    (host.querySelector(".inv-sheet") as HTMLElement | null) ?? host;

  try {
    await waitForLayout();
    await inlineImagesForCanvas(target);
    await waitForImages(target);

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "var(--surface-bg)",
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 1)
    );
    if (!blob) {
      throw new Error("Could not create receipt image");
    }

    const safeName = payload.sale.sales_id.replace(/[^\w-]+/g, "_");
    triggerPngDownload(blob, `receipt-${safeName}.png`);
  } finally {
    document.body.removeChild(host);
  }
}

function triggerPngDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.onload = done;
          img.onerror = done;
          window.setTimeout(done, 2500);
        })
    )
  ).then(() => undefined);
}

async function inlineImagesForCanvas(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) {
        return;
      }

      img.crossOrigin = "anonymous";

      try {
        const blob = await fetchReceiptImageBlob(src);
        if (!blob) {
          img.remove();
          return;
        }
        const dataUrl = await blobToDataUrl(blob);
        img.src = dataUrl;
      } catch {
        img.remove();
      }
    })
  );
}

async function fetchReceiptImageBlob(url: string): Promise<Blob | null> {
  const absolute = toAbsoluteUrl(url);
  const apiBase = getApiBaseUrl();

  try {
    const res = await fetch(absolute, {
      mode: "cors",
      credentials: apiBase && absolute.startsWith(apiBase) ? "include" : "omit",
    });
    if (!res.ok) {
      return null;
    }
    return await res.blob();
  } catch {
    return null;
  }
}

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (url.startsWith("//")) {
    return `${window.location.protocol}${url}`;
  }
  if (url.startsWith("/")) {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
      return `${apiBase}${url}`;
    }
    return `${window.location.origin}${url}`;
  }
  return url;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}
