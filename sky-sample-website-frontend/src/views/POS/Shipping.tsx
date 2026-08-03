import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ShippingDashboard from "./shipping/ShippingDashboard";
import ShippingFormPage from "./shipping/ShippingFormPage";

const Shipping: React.FC = () => (
  <Routes>
    <Route index element={<ShippingDashboard />} />
    <Route path="new" element={<ShippingFormPage />} />
    <Route path=":id/edit" element={<ShippingFormPage />} />
    <Route path="*" element={<Navigate to="/shipping" replace />} />
  </Routes>
);

export default Shipping;
