const STORAGE_KEY = "posActiveLocation";

export const MAIN_LOCATION = "Main Location";

export function getActiveLocation(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.trim() !== "" ? value : MAIN_LOCATION;
  } catch {
    return MAIN_LOCATION;
  }
}

export function setActiveLocation(location: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, location.trim() || MAIN_LOCATION);
  } catch {
    // ignore
  }
}
