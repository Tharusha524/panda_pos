import { useEffect } from "react";
import useCompanyLogo, { DEFAULT_LOGO } from "./useCompanyLogo";

/** Swaps the browser tab icon to the company's uploaded logo while the app shell is mounted. */
function useFaviconSync(): void {
  const { logoUrl } = useCompanyLogo();

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    const previousHref = link.href;
    link.href = logoUrl;

    return () => {
      if (link) {
        link.href = previousHref || DEFAULT_LOGO;
      }
    };
  }, [logoUrl]);
}

export default useFaviconSync;
