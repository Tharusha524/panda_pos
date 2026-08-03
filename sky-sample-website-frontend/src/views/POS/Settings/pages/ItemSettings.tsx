import React from "react";
import SettingsPageShell from "../components/SettingsPageShell";
import ItemSettingsForm from "../../inventory/ItemSettingsForm";

const ItemSettings: React.FC = () => (
  <SettingsPageShell
    title="Item Settings"
    subtitle="Product fields, SKU, discounts, and sales options"
    wide
    hideSave
  >
    <ItemSettingsForm showSaveButton />
  </SettingsPageShell>
);

export default ItemSettings;
