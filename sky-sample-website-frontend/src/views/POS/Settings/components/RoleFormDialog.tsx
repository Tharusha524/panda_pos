import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  AVAILABLE_PERMISSIONS,
  type Role,
  type RolePayload,
} from "../../../../api/Settings/rolesApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";

interface RoleFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  role?: Role | null;
  onClose: () => void;
  onCreate: (payload: RolePayload) => void;
  onUpdate: (id: number, payload: Partial<RolePayload>) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  open,
  mode,
  role,
  onClose,
  onCreate,
  onUpdate,
  isSubmitting = false,
  error = null,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (open && isEdit && role) {
      setName(role.name);
      setSlug(role.slug);
      setDescription(role.description ?? "");
      setPermissions(role.permissions ?? []);
      setIsActive(role.is_active);
    }
    if (open && !isEdit) {
      setName("");
      setSlug("");
      setDescription("");
      setPermissions([]);
      setIsActive(true);
    }
  }, [open, isEdit, role]);

  const togglePermission = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = () => {
    const payload: RolePayload = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      permissions,
      is_active: isActive,
    };

    if (isEdit && role) {
      onUpdate(role.id, payload);
    } else {
      onCreate(payload);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      sx={POS_DIALOG_PAPER_SX}
    >
      <DialogTitle sx={{ color: "var(--pallet-blue)", fontWeight: 700, px: 3, pt: 2.5, fontSize: "1.25rem" }}>
        {isEdit ? "Edit Role" : "Add Role"}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          margin="normal"
          helperText="Leave empty to auto-generate from name"
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          }
          label="Active"
          sx={{ mt: 1 }}
        />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: "var(--pallet-blue)" }}>
          Permissions (included in this role)
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {AVAILABLE_PERMISSIONS.map((permission) => (
            <Chip
              key={permission}
              label={permission}
              clickable
              onClick={() => togglePermission(permission)}
              sx={
                permissions.includes(permission)
                  ? { bgcolor: "var(--pallet-blue)", color: "#fff" }
                  : undefined
              }
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none", minWidth: 120 }}
        >
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save Changes"
              : "Add Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleFormDialog;
