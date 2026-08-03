import React from "react";
import { Route, Routes } from "react-router";
import SupplierDashboard from "./suppliers/SupplierDashboard";
import SupplierFormPage from "./SupplierFormPage";

const Suppliers: React.FC = () => (
  <Routes>
    <Route index element={<SupplierDashboard />} />
    <Route path="new" element={<SupplierFormPage />} />
    <Route path=":id/edit" element={<SupplierFormPage />} />
  </Routes>
);

export default Suppliers;
