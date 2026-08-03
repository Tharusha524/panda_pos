import React from "react";
import { Navigate, Route, Routes } from "react-router";
import { SettingsProvider } from "./SettingsContext";
import SettingsHub from "./SettingsHub";
import UserSettingsHub from "./pages/UserSettingsHub";
import UserProfileSettings from "./pages/UserProfileSettings";
import LoginHistorySettings from "./pages/LoginHistorySettings";
import UsersManagement from "./pages/UsersManagement";
import RolesManagement from "./pages/RolesManagement";
import EmployeeAccessGuard from "./components/EmployeeAccessGuard";
import CompanySettingsHub from "./pages/CompanySettingsHub";
import CompanyManage from "./pages/CompanyManage";
import CompanyNotificationSettings from "./pages/CompanyNotificationSettings";
import BranchManagement from "./pages/BranchManagement";
import CurrencyLanguageSettings from "./pages/CurrencyLanguageSettings";
import ItemSettings from "./pages/ItemSettings";
import InventorySettings from "./pages/InventorySettings";
import OrderSettings from "./pages/OrderSettings";
import HardwareSettings from "./pages/HardwareSettings";
import EmployeeSettings from "./pages/EmployeeSettings";
import MultipleSystemsSettings from "./pages/MultipleSystemsSettings";
import RepairSettings from "./pages/RepairSettings";
import EmailSettings from "./pages/EmailSettings";
import NotificationSettingsHub from "./pages/NotificationSettingsHub";
import SalesNotificationSettings from "./pages/SalesNotificationSettings";
import PaymentNotificationSettings from "./pages/PaymentNotificationSettings";
import BankSettings from "./pages/BankSettings";
import AlertSettings from "./pages/AlertSettings";
import PaymentSettings from "./pages/PaymentSettings";
import TaxSettingsPage from "./pages/TaxSettings";
import SubscriptionSettingsHub from "./pages/SubscriptionSettingsHub";
import SubscriptionManage from "./pages/SubscriptionManage";
import InfoSettings from "./pages/InfoSettings";
import ApiConfigurationSettings from "./pages/ApiConfigurationSettings";
import BackupSettings from "./pages/BackupSettings";

const Settings: React.FC = () => {
  return (
    <SettingsProvider>
      <Routes>
        <Route index element={<SettingsHub />} />
        <Route path="user" element={<UserSettingsHub />} />
        <Route path="user/profile" element={<UserProfileSettings />} />
        <Route path="user/login-history" element={<LoginHistorySettings />} />
        <Route
          path="user/users"
          element={
            <EmployeeAccessGuard>
              <UsersManagement />
            </EmployeeAccessGuard>
          }
        />
        <Route
          path="user/roles"
          element={
            <EmployeeAccessGuard>
              <RolesManagement />
            </EmployeeAccessGuard>
          }
        />
        <Route path="company" element={<CompanySettingsHub />} />
        <Route path="company/manage" element={<CompanyManage />} />
        <Route path="company/branch" element={<BranchManagement />} />
        <Route path="company/currency-language" element={<CurrencyLanguageSettings />} />
        <Route path="company/notifications" element={<CompanyNotificationSettings />} />
        <Route path="item" element={<ItemSettings />} />
        <Route path="inventory" element={<InventorySettings />} />
        <Route path="order" element={<OrderSettings />} />
        <Route path="hardware" element={<HardwareSettings />} />
        <Route path="employee" element={<EmployeeSettings />} />
        <Route path="multiple-systems" element={<MultipleSystemsSettings />} />
        <Route path="repair" element={<RepairSettings />} />
        <Route path="email" element={<EmailSettings />} />
        <Route path="notification" element={<NotificationSettingsHub />} />
        <Route path="notification/sales" element={<SalesNotificationSettings />} />
        <Route path="notification/payment" element={<PaymentNotificationSettings />} />
        <Route path="bank" element={<BankSettings />} />
        <Route path="alert" element={<AlertSettings />} />
        <Route path="payment" element={<PaymentSettings />} />
        <Route path="tax" element={<TaxSettingsPage />} />
        <Route path="subscription" element={<SubscriptionSettingsHub />} />
        <Route path="subscription/manage" element={<SubscriptionManage />} />
        <Route path="api" element={<ApiConfigurationSettings />} />
        <Route path="backup" element={<BackupSettings />} />
        <Route path="info" element={<InfoSettings />} />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>
    </SettingsProvider>
  );
};

export default Settings;
