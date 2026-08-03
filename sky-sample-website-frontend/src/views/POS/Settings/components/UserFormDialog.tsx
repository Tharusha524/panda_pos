import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import type { Role } from "../../../../api/Settings/rolesApi";
import type {
  CreateSettingsUserPayload,
  SettingsUser,
  UpdateSettingsUserPayload,
} from "../../../../api/Settings/settingsUsersApi";
import { getRoleSlug } from "../../../../api/Settings/settingsUsersApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";

const MIN_PASSWORD_LENGTH = 8;

interface UserFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  user?: SettingsUser | null;
  roles: Role[];
  onClose: () => void;
  onCreate: (payload: CreateSettingsUserPayload) => void;
  onUpdate: (id: number, payload: UpdateSettingsUserPayload) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  mode,
  user,
  roles,
  onClose,
  onCreate,
  onUpdate,
  isSubmitting = false,
  error = null,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("staff");
  const [status, setStatus] = useState("active");

  const isEdit = mode === "edit";

  useEffect(() => {
    if (open && isEdit && user) {
      setName(user.name);
      setEmail(user.email);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPhone(user.phone ?? "");
      setCity(user.city ?? "");
      setRole(getRoleSlug(user));
      setStatus(user.status ?? "active");
    }
    if (open && !isEdit) {
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPhone("");
      setCity("");
      setRole("staff");
      setStatus("active");
    }
  }, [open, isEdit, user]);

  const handleClose = () => {
    onClose();
  };

  const passwordTooShort =
    password.trim().length > 0 && password.trim().length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const confirmRequired = !isEdit || password.trim().length > 0;
  const confirmMissing = confirmRequired && !confirmPassword.trim();

  const passwordValid = isEdit
    ? !password.trim() ||
      (password.trim().length >= MIN_PASSWORD_LENGTH &&
        password === confirmPassword)
    : password.trim().length >= MIN_PASSWORD_LENGTH &&
      password === confirmPassword;

  const handleSubmit = () => {
    if (!passwordValid) return;

    if (isEdit && user) {
      const payload: UpdateSettingsUserPayload = {
        name,
        email,
        phone: phone || undefined,
        city: city || undefined,
        role,
        status,
      };
      if (password.trim()) {
        payload.password = password;
      }
      onUpdate(user.id, payload);
    } else {
      onCreate({
        name,
        email,
        password,
        phone: phone || undefined,
        city: city || undefined,
        role,
        status,
      });
    }
  };

  const canSubmit =
    name.trim() &&
    email.trim() &&
    passwordValid &&
    !confirmMissing &&
    (isEdit || password.trim());

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      sx={POS_DIALOG_PAPER_SX}
    >
      <DialogTitle sx={{ color: "var(--pallet-blue)", fontWeight: 700, px: 3, pt: 2.5, fontSize: "1.25rem" }}>
        {isEdit ? "Edit Employee" : "Add Employee Login"}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label={isEdit ? "New Password (optional)" : "Password"}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required={!isEdit}
          error={passwordTooShort || (passwordsMismatch && confirmPassword.length > 0)}
          helperText={
            passwordTooShort
              ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
              : isEdit
                ? "Leave blank to keep current password"
                : `Minimum ${MIN_PASSWORD_LENGTH} characters`
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label={isEdit ? "Confirm new password" : "Confirm Password"}
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required={!isEdit}
          error={passwordsMismatch || confirmMissing}
          helperText={
            passwordsMismatch
              ? "Passwords do not match"
              : confirmMissing
                ? "Please confirm the password"
                : isEdit
                  ? "Required when setting a new password"
                  : "Re-enter the password"
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role (access level)</InputLabel>
          <Select
            value={role}
            label="Role (access level)"
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.slug}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          The role controls which POS menus this person sees after they log in. Change permissions under
          Roles &amp; Access.
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none", minWidth: 120 }}
        >
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save Changes"
              : "Create Login"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialog;
