import React from "react";
import { Navigate, Route, Routes } from "react-router";
import SalesDashboard from "./sales/SalesDashboard";
import SaleFormPage from "./sales/SaleFormPage";
import PosSaleFormPage from "./sales/PosSaleFormPage";

const Sales: React.FC = () => (
  <Routes>
    <Route index element={<SalesDashboard />} />
    <Route path="new" element={<PosSaleFormPage />} />
    <Route path=":id/edit" element={<SaleFormPage />} />
    <Route path="*" element={<Navigate to="/sales" replace />} />
  </Routes>
);

export default Sales;
