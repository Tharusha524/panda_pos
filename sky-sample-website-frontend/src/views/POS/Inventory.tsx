import React from "react";
import { Navigate, Route, Routes } from "react-router";
import InventoryDashboard from "./inventory/InventoryDashboard";
import InventorySettingsPage from "./inventory/InventorySettingsPage";

/** Inventory section router */
const Inventory: React.FC = () => (
  <Routes>
    <Route index element={<InventoryDashboard />} />
    <Route path="settings" element={<InventorySettingsPage />} />
    <Route path="items" element={<Navigate to="/items" replace />} />
    <Route path="categories" element={<Navigate to="/items/categories" replace />} />
    <Route path="*" element={<Navigate to="/inventory" replace />} />
  </Routes>
);

export default Inventory;
