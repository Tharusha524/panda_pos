import React from "react";
import CustomerNotificationForm from "../components/CustomerNotificationForm";

const SalesNotificationSettings: React.FC = () => (
  <CustomerNotificationForm
    type="sales"
    pageTitle="Sales notifications"
    pageSubtitle="Email and SMS for customer sales orders"
  />
);

export default SalesNotificationSettings;
