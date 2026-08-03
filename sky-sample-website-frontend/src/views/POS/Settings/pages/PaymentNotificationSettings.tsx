import React from "react";
import CustomerNotificationForm from "../components/CustomerNotificationForm";

const PaymentNotificationSettings: React.FC = () => (
  <CustomerNotificationForm
    type="payment"
    pageTitle="Payment notifications"
    pageSubtitle="Email and SMS for customer payments"
  />
);

export default PaymentNotificationSettings;
