import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ExpensesDashboard from "./expenses/ExpensesDashboard";
import ExpenseFormPage from "./expenses/ExpenseFormPage";

const Expenses: React.FC = () => (
  <Routes>
    <Route index element={<ExpensesDashboard />} />
    <Route path="new" element={<ExpenseFormPage />} />
    <Route path=":id/edit" element={<ExpenseFormPage />} />
    <Route path="*" element={<Navigate to="/expenses" replace />} />
  </Routes>
);

export default Expenses;
