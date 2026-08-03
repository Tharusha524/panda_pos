import React from "react";
import SettingsPageShell from "../components/SettingsPageShell";
import UsersTable from "../components/UsersTable";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";

const UsersManagement: React.FC = () => {
  return (
    <SettingsPageShell
      title="Employee Users"
      subtitle="Create logins for your staff — each person uses their own email and password"
      wide
      backTo={USER_SETTINGS_BASE}
      backLabel="User Settings"
      hideSave
    >
      <UsersTable embedded />
    </SettingsPageShell>
  );
};

export default UsersManagement;
