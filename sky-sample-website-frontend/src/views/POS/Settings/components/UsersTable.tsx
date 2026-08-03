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
import { fetchRoles } from "../../../../api/Settings/rolesApi";
import {
  createSettingsUser,
  deleteSettingsUser,
  fetchSettingsUsers,
  getRoleLabel,
  updateSettingsUser,
  type CreateSettingsUserPayload,
  type SettingsUser,
  type UpdateSettingsUserPayload,
} from "../../../../api/Settings/settingsUsersApi";
import UserFormDialog from "./UserFormDialog";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";

interface UsersTableProps {
  embedded?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ embedded = false }) => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<SettingsUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error: fetchError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["settings-users"],
    queryFn: () => fetchSettingsUsers(100),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const createMutation = useMutation({
    mutationFn: createSettingsUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      setDialogOpen(false);
      setDialogError(null);
      setError(null);
      setMessage("Employee account created — they can log in with their email and password.");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setDialogError(getFriendlyErrorMessage(err, "Failed to add user"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSettingsUserPayload }) =>
      updateSettingsUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      setDialogOpen(false);
      setSelectedUser(null);
      setDialogError(null);
      setError(null);
      setMessage("User updated successfully!");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setDialogError(getFriendlyErrorMessage(err, "Failed to update user"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSettingsUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      setError(null);
      setMessage("User deleted successfully!");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(getFriendlyErrorMessage(err, "Failed to delete user"));
    },
  });

  const openCreate = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setDialogError(null);
    setDialogOpen(true);
  };

  const openEdit = (user: SettingsUser) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleCreate = (payload: CreateSettingsUserPayload) => {
    createMutation.mutate(payload);
  };

  const handleUpdate = (id: number, payload: UpdateSettingsUserPayload) => {
    updateMutation.mutate({ id, payload });
  };

  const fetchErrorMessage = getFriendlyErrorMessage(
    fetchError,
    "Failed to load users. Please log in and try again."
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
              Users
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Live data from database ({users.length} user{users.length !== 1 ? "s" : ""})
            </Typography>
          </Box>
        )}
        {embedded && (
          <Typography variant="caption" color="text.secondary">
            {users.length} user{users.length !== 1 ? "s" : ""} in database
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
            Add Employee
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
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(isLoading || isFetching) && users.length === 0 && (
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
            {!isLoading && !isError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No employee accounts yet. Click Add Employee to create a login.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone ?? "—"}</TableCell>
                <TableCell>{user.city ?? "—"}</TableCell>
                <TableCell>
                  <Chip label={getRoleLabel(user)} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.status === "active" ? "Active" : "Inactive"}
                    size="small"
                    color={user.status === "active" ? "success" : "default"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      sx={{ color: "var(--pallet-blue)" }}
                      onClick={() => openEdit(user)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        deleteConfirm.requestDelete({
                          title: "Delete user",
                          message: `Delete user "${user.name}"? This cannot be undone.`,
                          onConfirm: () => deleteMutation.mutate(user.id),
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

      <UserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        roles={roles}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser(null);
          setDialogError(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
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

export default UsersTable;
