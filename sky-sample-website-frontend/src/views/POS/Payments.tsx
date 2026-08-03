import React from "react";
import { Navigate, Route, Routes } from "react-router";
import PaymentDashboard from "./payments/PaymentDashboard";
import PaymentFormPage from "./payments/PaymentFormPage";

const Payments: React.FC = () => (
  <Routes>
    <Route index element={<PaymentDashboard />} />
    <Route path="new" element={<Navigate to="/payments" replace />} />
    <Route path=":id/edit" element={<PaymentFormPage />} />
    <Route path="*" element={<Navigate to="/payments" replace />} />
  </Routes>
);

export default Payments;
