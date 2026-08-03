import React from "react";
import { Navigate, Route, Routes } from "react-router";
import PurchasingDashboard from "./purchasing/PurchasingDashboard";
import PurchaseFormPage from "./purchasing/PurchaseFormPage";
import PurchaseNewFormPage from "./purchasing/PurchaseNewFormPage";

const Purchasing: React.FC = () => (
  <Routes>
    <Route index element={<PurchasingDashboard />} />
    <Route path="new" element={<PurchaseNewFormPage />} />
    <Route path=":id/edit" element={<PurchaseFormPage />} />
    <Route path="*" element={<Navigate to="/purchasing" replace />} />
  </Routes>
);

export default Purchasing;
