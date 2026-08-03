import React from "react";
import { Navigate, Route, Routes } from "react-router";
import CustomerDashboard from "./customers/CustomerDashboard";
import CustomerFormPage from "./customers/CustomerFormPage";

const Customers: React.FC = () => (
  <Routes>
    <Route index element={<CustomerDashboard />} />
    <Route path="new" element={<CustomerFormPage />} />
    <Route path=":id/edit" element={<CustomerFormPage />} />
    <Route path="*" element={<Navigate to="/customers" replace />} />
  </Routes>
);

export default Customers;
