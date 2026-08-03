import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import {
  createBranch,
  deleteBranch,
  fetchBranches,
  updateBranch,
  type BranchPayload,
} from "../../../../api/Settings/branchApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";

const BranchManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: branches = [], isLoading, isError, error: fetchError } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setMessage("Branch added successfully!");
      setError(null);
      resetForm();
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(getFriendlyErrorMessage(err, "Failed to add branch"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BranchPayload }) =>
      updateBranch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setMessage("Branch updated successfully!");
      setError(null);
      resetForm();
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(getFriendlyErrorMessage(err, "Failed to update branch"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setMessage("Branch deleted successfully!");
      setError(null);
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(getFriendlyErrorMessage(err, "Failed to delete branch"));
    },
  });

  const resetForm = () => {
    setForm({ name: "", address: "", city: "", phone: "" });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      return;
    }
    const payload: BranchPayload = {
      name: form.name,
      address: form.address || undefined,
      city: form.city || undefined,
      phone: form.phone || undefined,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (branch: {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
  }) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      address: branch.address ?? "",
      city: branch.city ?? "",
      phone: branch.phone ?? "",
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SettingsPageShell
      title="Manage Branch"
      subtitle="Add and manage your branch locations"
      wide
      backTo={COMPANY_SETTINGS_BASE}
      backLabel="Company"
      hideSave
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        You can add your branch&apos;s details. Use Add to create new branches.
      </Typography>

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

      <Paper sx={{ p: 2, mb: 3, border: "1px solid var(--pallet-border-blue)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--pallet-blue)", mb: 2 }}>
          {editingId !== null ? "Edit Branch" : "Add Branch"}
        </Typography>
        <TextField
          fullWidth
          label="Branch Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Address"
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          margin="normal"
        />
        <TextField
          fullWidth
          label="City"
          value={form.city}
          onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          margin="normal"
        />
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleSave}
            disabled={!form.name.trim() || isSaving}
            sx={{
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {isSaving
              ? "Saving..."
              : editingId !== null
                ? "Save Changes"
                : "Add Branch"}
          </Button>
          {editingId !== null && (
            <Button onClick={resetForm} disabled={isSaving}>
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
        </Box>
      ) : isError ? (
        <Alert severity="error">
          {getFriendlyErrorMessage(fetchError, "Failed to load branches")}
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid var(--pallet-border-blue)" }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No branches in database. Add your first branch above.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id} hover>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell>{branch.address ?? "—"}</TableCell>
                    <TableCell>{branch.city ?? "—"}</TableCell>
                    <TableCell>{branch.phone ?? "—"}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          sx={{ color: "var(--pallet-blue)" }}
                          onClick={() => handleEdit(branch)}
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
                              title: "Delete branch",
                              message: `Delete branch "${branch.name}"? This cannot be undone.`,
                              onConfirm: () => deleteMutation.mutate(branch.id),
                            });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default BranchManagement;
