import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ReportHub from "./ReportHub";
import ReportCategoryHub from "./ReportCategoryHub";
import ReportViewer from "./ReportViewer";

const Reports: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ReportHub />} />
      <Route path=":categoryId" element={<ReportCategoryHub />} />
      <Route path=":categoryId/:reportKey" element={<ReportViewer />} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
};

export default Reports;
