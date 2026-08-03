import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import {
  getUserSettings,
  updateUserSettings,
  type UserSettingsPayload,
} from "../../../../api/Settings/userSettingsApi";
import { fetchRoles } from "../../../../api/Settings/rolesApi";
import { getStoredUser } from "../../../../api/userApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";
import usePosAccess from "../../../../hooks/usePosAccess";

const POS_ACCESS_LABELS: Record<string, string> = {
  "pos.dashboard": "Dashboard",
  "pos.sales": "Sales",
  "pos.payments": "Payments",
  "pos.expenses": "Expenses",
  "pos.customers": "Customers",
  "pos.items": "Items",
  "pos.inventory": "Inventory",
  "pos.purchasing": "Purchasing",
  "pos.suppliers": "Suppliers",
  "pos.shipping": "Shipping",
  "pos.offers": "Offers",
  "pos.repair": "Repair",
  "pos.reports": "Reports",
  "pos.settings": "Settings",
  "users.manage": "Manage employee users",
};

const UserProfileSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { posAccess, isAdmin, canManageUsers } = usePosAccess();
  const allowedModules = useMemo(
    () =>
      Object.entries(posAccess)
        .filter(([, allowed]) => allowed)
        .map(([key]) => POS_ACCESS_LABELS[key] ?? key),
    [posAccess]
  );
  const [form, setForm] = useState<UserSettingsPayload>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "user",
    two_factor_enabled: false,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  useEffect(() => {
    if (data) {
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        two_factor_enabled: data.two_factor_enabled,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["user-settings"], updated);
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            name: `${updated.first_name} ${updated.last_name}`.trim(),
            email: updated.email,
            phone: updated.phone,
            role: updated.role,
          })
        );
      }
      setSaveError(null);
      setSaveMessage("User settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save settings"));
    },
  });

  const handleChange = (field: keyof UserSettingsPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell
        title="User Profile"
        subtitle="Your account details"
        wide
        backTo={USER_SETTINGS_BASE}
        backLabel="User Settings"
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell
        title="User Profile"
        subtitle="Your account details"
        wide
        backTo={USER_SETTINGS_BASE}
        backLabel="User Settings"
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(
            error,
            "Failed to load user settings. Please log in and try again."
          )}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="User Profile"
      subtitle="Your account details"
      onSave={() => saveMutation.mutate(form)}
      isSaving={saveMutation.isPending}
      wide
      backTo={USER_SETTINGS_BASE}
      backLabel="User Settings"
    >
      {saveMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {saveMessage}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
      <Typography variant="h6" sx={{ mb: 2, color: "var(--pallet-blue)" }}>
        User Profile
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {isAdmin ? (
          <>You are signed in as <strong>Administrator</strong> with full POS access.</>
        ) : (
          <>
            Your account can access:{" "}
            <strong>{allowedModules.length ? allowedModules.join(", ") : "no modules"}</strong>.
            {canManageUsers ? " You can also create employee logins under User Settings." : ""}
          </>
        )}
      </Alert>
      <TextField
        fullWidth
        label="First Name"
        value={form.first_name}
        onChange={(e) => handleChange("first_name", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Last Name"
        value={form.last_name}
        onChange={(e) => handleChange("last_name", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Phone"
        value={form.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        margin="normal"
      />
      {canManageUsers ? (
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={form.role}
            label="Role"
            onChange={(e) => handleChange("role", e.target.value)}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.slug}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          label="Role"
          value={roles.find((r) => r.slug === form.role)?.name ?? form.role}
          margin="normal"
          disabled
          helperText="Only an administrator can change your role."
        />
      )}
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.two_factor_enabled}
            onChange={(e) => handleChange("two_factor_enabled", e.target.checked)}
          />
        }
        label="Enable Two-Factor Authentication"
      />
    </SettingsPageShell>
  );
};

export default UserProfileSettings;
