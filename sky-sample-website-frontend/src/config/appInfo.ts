export const APP_INFO = {
  applicationName: "Sky Smart Software",
  version: "1.0.0",
  environment: "Production",
  developer: "Danushka Harshana",
  licenseType: "Professional",
} as const;

export function formatStoreId(cloudId?: number | null): string {
  if (cloudId == null) {
    return "—";
  }
  return `SKY-${cloudId}`;
}
