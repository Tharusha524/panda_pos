import { useEffect } from "react";
import useCompanyLogo from "./useCompanyLogo";

/** Swaps the browser tab icon to the company's uploaded logo while the app shell is mounted. */
function useFaviconSync(): void {
  const { logoUrl, isLoading } = useCompanyLogo();

  useEffect(() => {
    if (isLoading || !logoUrl) {
      return;
    }

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;

    return () => {
      // Keep the startup icon in place when the shell unmounts.
    };
  }, [isLoading, logoUrl]);
}

export default useFaviconSync;
