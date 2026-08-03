import React from "react";
import { Route, Routes } from "react-router";
import OfferDashboard from "./offers/OfferDashboard";
import OfferFormPage from "./OfferFormPage";

const Offers: React.FC = () => (
  <Routes>
    <Route index element={<OfferDashboard />} />
    <Route path="new" element={<OfferFormPage />} />
    <Route path=":id/edit" element={<OfferFormPage />} />
  </Routes>
);

export default Offers;
