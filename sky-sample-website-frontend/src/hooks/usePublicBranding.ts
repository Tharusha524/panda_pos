import { useQuery } from "@tanstack/react-query";
import { getPublicBranding } from "../api/Settings/brandingApi";
import { APP_INFO } from "../config/appInfo";

const DEFAULT_LOGO = `${import.meta.env.BASE_URL}company-logo1.jpg`;

/** Logo/name for pre-auth screens (login, register, backend-configure). */
function usePublicBranding(): { logoUrl: string; companyName: string } {
  const { data } = useQuery({
    queryKey: ["public-branding"],
    queryFn: getPublicBranding,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    logoUrl: data?.logo_url || DEFAULT_LOGO,
    companyName: data?.name || APP_INFO.applicationName,
  };
}

export default usePublicBranding;
