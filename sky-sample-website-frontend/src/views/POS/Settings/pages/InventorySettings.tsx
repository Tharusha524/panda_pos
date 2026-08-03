import React from "react";
import SettingsPageShell from "../components/SettingsPageShell";
import InventorySettingsForm from "../../inventory/InventorySettingsForm";

const InventorySettings: React.FC = () => (
  <SettingsPageShell
    title="Inventory"
    subtitle="Update your inventory more details"
    wide
    hideSave
  >
    <InventorySettingsForm showSaveButton />
  </SettingsPageShell>
);

export default InventorySettings;
