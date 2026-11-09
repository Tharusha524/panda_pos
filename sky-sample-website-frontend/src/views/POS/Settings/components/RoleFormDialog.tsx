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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  allMobileKeys,
  AVAILABLE_PERMISSIONS,
  fetchMobilePermissionCatalog,
  isMobilePermission,
  MOBILE_CONFIGURED,
  type Role,
  type RolePayload,
} from "../../../../api/Settings/rolesApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";
import MobilePermissionsEditor from "./MobilePermissionsEditor";

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
  const [activeTab, setActiveTab] = useState<"website" | "mobile">("website");
  // null = role has never had its Mobile App section saved (full mobile access).
  const [savedMobile, setSavedMobile] = useState<string[] | null>(null);
  const [mobileSelected, setMobileSelected] = useState<Set<string>>(new Set());

  const isEdit = mode === "edit";

  const {
    data: mobileCatalog,
    isLoading: mobileCatalogLoading,
    isError: mobileCatalogError,
  } = useQuery({
    queryKey: ["mobile-permission-catalog"],
    queryFn: fetchMobilePermissionCatalog,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const catalogReady = !!mobileCatalog && mobileCatalog.length > 0;

  useEffect(() => {
    if (open && isEdit && role) {
      const all = role.permissions ?? [];
      setName(role.name);
      setSlug(role.slug);
      setDescription(role.description ?? "");
      setPermissions(all.filter((p) => !isMobilePermission(p)));
      setSavedMobile(
        all.includes(MOBILE_CONFIGURED)
          ? all.filter((p) => isMobilePermission(p) && p !== MOBILE_CONFIGURED)
          : null
      );
      setIsActive(role.is_active);
    }
    if (open && !isEdit) {
      setName("");
      setSlug("");
      setDescription("");
      setPermissions([]);
      setSavedMobile(null);
      setIsActive(true);
    }
    if (open) {
      setActiveTab("website");
    }
  }, [open, isEdit, role]);

  // Show the role's real mobile access: never-saved roles have everything on.
  useEffect(() => {
    if (!open || !catalogReady) return;
    const known = new Set(allMobileKeys(mobileCatalog));
    setMobileSelected(
      savedMobile === null ? known : new Set(savedMobile.filter((k) => known.has(k)))
    );
  }, [open, catalogReady, mobileCatalog, savedMobile]);

  const togglePermission = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = () => {
    let mobile: string[];
    if (catalogReady) {
      mobile = [MOBILE_CONFIGURED, ...mobileSelected];
    } else if (savedMobile !== null) {
      // Catalog didn't load — keep the role's mobile access exactly as it was.
      mobile = [MOBILE_CONFIGURED, ...savedMobile];
    } else {
      mobile = [];
    }

    const payload: RolePayload = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      permissions: [...permissions, ...mobile],
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
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mt: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="website" label="Website" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab value="mobile" label="Mobile App" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>
        {activeTab === "website" && (
          <>
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
          </>
        )}
        {activeTab === "mobile" && (
          <MobilePermissionsEditor
            catalog={mobileCatalog}
            isLoading={mobileCatalogLoading}
            isError={mobileCatalogError}
            selected={mobileSelected}
            onChange={setMobileSelected}
          />
        )}
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
