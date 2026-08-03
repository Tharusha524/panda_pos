import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ItemsDashboard from "./inventory/ItemsDashboard";
import CategoriesPage from "./inventory/CategoriesPage";
import ItemFormPage from "./inventory/ItemFormPage";
import ItemSettingsPage from "./inventory/ItemSettingsPage";

/** Items section router */
const Items: React.FC = () => (
  <Routes>
    <Route index element={<ItemsDashboard />} />
    <Route path="settings" element={<ItemSettingsPage />} />
    <Route path="new" element={<ItemFormPage />} />
    <Route path=":id/edit" element={<ItemFormPage />} />
    <Route path="categories" element={<CategoriesPage />} />
    <Route path="*" element={<Navigate to="/items" replace />} />
  </Routes>
);

export default Items;
