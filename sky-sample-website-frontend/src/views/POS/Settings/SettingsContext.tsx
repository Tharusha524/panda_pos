import React, { createContext, useContext, useState } from "react";
import { defaultSettings } from "./defaults";
import type { POSSettings } from "./types";

interface SettingsContextValue {
  settings: POSSettings;
  handleInputChange: (field: keyof POSSettings, value: unknown) => void;
  handleSave: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<POSSettings>(defaultSettings);

  const handleInputChange = (field: keyof POSSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <SettingsContext.Provider
      value={{ settings, handleInputChange, handleSave }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
