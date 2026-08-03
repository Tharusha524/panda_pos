import axios from "axios";

export interface PublicBranding {
  name: string | null;
  logo_url: string | null;
}

/** Public — no auth. Used on the login/register/backend-configure screens. */
export async function getPublicBranding(): Promise<PublicBranding> {
  const res = await axios.get("/api/branding");
  return res.data.data;
}
