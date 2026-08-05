import { useQuery } from "@tanstack/react-query";
import { getCompanySettings } from "../api/Settings/companySettingsApi";
import { APP_INFO } from "../config/appInfo";

const DEFAULT_LOGO = `${import.meta.env.BASE_URL}company-logo1.jpg`;

/**
 * Company branding for the authenticated app shell (sidebar, app bar, tab icon).
 * Shares the "company-settings" query cache with the Manage Company page, so
 * uploading a logo / renaming the company there updates every place that uses
 * this hook, without a page refresh.
 */
function useCompanyLogo(): {
  logoUrl: string;
  hasCustomLogo: boolean;
  companyName: string;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
    staleTime: 5 * 60 * 1000,
  });

  return {
    logoUrl: isLoading ? "" : data?.logo_url || DEFAULT_LOGO,
    hasCustomLogo: Boolean(data?.logo_url),
    companyName: data?.name || APP_INFO.applicationName,
    isLoading,
  };
}

export default useCompanyLogo;
export { DEFAULT_LOGO };
