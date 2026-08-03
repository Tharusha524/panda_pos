import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  fetchRoles,
  updateRole,
  type Role,
  type RolePayload,
} from "../../../../api/Settings/rolesApi";
import RoleFormDialog from "./RoleFormDialog";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";

interface RolesTableProps {
  embedded?: boolean;
}

const RolesTable: React.FC<RolesTableProps> = ({ embedded = false }) => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const {
    data: roles = [],
    isLoading,
    isError,
    error: fetchError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDialogOpen(false);
      setDialogError(null);
      setError(null);
      setMessage("Role added successfully!");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setDialogError(getFriendlyErrorMessage(err, "Failed to add role"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RolePayload> }) =>
      updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDialogOpen(false);
      setSelectedRole(null);
      setDialogError(null);
      setError(null);
      setMessage("Role updated successfully!");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setDialogError(getFriendlyErrorMessage(err, "Failed to update role"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setError(null);
      setMessage("Role deleted successfully!");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(getFriendlyErrorMessage(err, "Failed to delete role"));
    },
  });

  const openCreate = () => {
    setDialogMode("create");
    setSelectedRole(null);
    setDialogError(null);
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setDialogMode("edit");
    setSelectedRole(role);
    setDialogError(null);
    setDialogOpen(true);
  };

  const fetchErrorMessage = getFriendlyErrorMessage(
    fetchError,
    "Failed to load roles. Please try again."
  );

  return (
    <Box sx={{ mt: embedded ? 0 : 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: embedded ? "flex-end" : "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {!embedded && (
          <Box>
            <Typography variant="h6" sx={{ color: "var(--pallet-blue)", fontWeight: 600 }}>
              Roles
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Live data from database ({roles.length} role{roles.length !== 1 ? "s" : ""})
            </Typography>
          </Box>
        )}
        {embedded && (
          <Typography variant="caption" color="text.secondary">
            {roles.length} role{roles.length !== 1 ? "s" : ""} in database
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh from database">
            <IconButton
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{ color: "var(--pallet-blue)" }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid var(--pallet-border-blue)",
          boxShadow: "0 0 10px rgba(0,0,0,0.08)",
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Users
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(isLoading || isFetching) && roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            )}
            {isError && !isLoading && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Alert severity="error">{fetchErrorMessage}</Alert>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No roles in database. Click Add to create one.
                </TableCell>
              </TableRow>
            )}
            {roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <Chip label={role.slug} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{role.description ?? "—"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(role.permissions ?? []).length === 0 && "—"}
                    {(role.permissions ?? []).slice(0, 2).map((perm) => (
                      <Chip key={perm} label={perm} size="small" />
                    ))}
                    {(role.permissions ?? []).length > 2 && (
                      <Chip
                        label={`+${role.permissions.length - 2} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">{role.users_count ?? 0}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={role.is_active ? "Active" : "Inactive"}
                    size="small"
                    color={role.is_active ? "success" : "default"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      sx={{ color: "var(--pallet-blue)" }}
                      onClick={() => openEdit(role)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteMutation.isPending || (role.users_count ?? 0) > 0}
                      onClick={() => {
                        deleteConfirm.requestDelete({
                          title: "Delete role",
                          message: `Delete role "${role.name}"? This cannot be undone.`,
                          onConfirm: () => deleteMutation.mutate(role.id),
                        });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <RoleFormDialog
        open={dialogOpen}
        mode={dialogMode}
        role={selectedRole}
        onClose={() => {
          setDialogOpen(false);
          setSelectedRole(null);
          setDialogError(null);
        }}
        onCreate={(payload) => createMutation.mutate(payload)}
        onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={dialogError}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default RolesTable;
