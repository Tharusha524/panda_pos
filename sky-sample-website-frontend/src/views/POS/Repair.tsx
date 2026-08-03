import React from "react";
import { Navigate, Route, Routes } from "react-router";
import RepairDashboard from "./repair/RepairDashboard";
import RepairTransferPage from "./repair/RepairTransferPage";

const Repair: React.FC = () => (
  <Routes>
    <Route index element={<RepairDashboard />} />
    <Route path="send" element={<RepairTransferPage mode="send" />} />
    <Route path="receive" element={<RepairTransferPage mode="receive" />} />
    <Route path="*" element={<Navigate to="/repair" replace />} />
  </Routes>
);

export default Repair;
