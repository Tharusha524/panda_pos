import React from "react";
import SettingsPageShell from "../components/SettingsPageShell";
import RolesTable from "../components/RolesTable";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";

const RolesManagement: React.FC = () => {
  return (
    <SettingsPageShell
      title="Roles"
      subtitle="Manage roles and permissions"
      wide
      backTo={USER_SETTINGS_BASE}
      backLabel="User Settings"
      hideSave
    >
      <RolesTable embedded />
    </SettingsPageShell>
  );
};

export default RolesManagement;
