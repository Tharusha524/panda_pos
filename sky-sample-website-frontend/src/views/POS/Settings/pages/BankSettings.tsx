import React, { useState } from "react";
import {
  Alert,
  Box,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import BankFormDialog from "../components/BankFormDialog";
import {
  createBank,
  deleteBank,
  fetchBanks,
  updateBank,
  type Bank,
  type BankPayload,
} from "../../../../api/Settings/bankApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";

const BankSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: banks = [],
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  const createMutation = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setMessage("Bank added successfully!");
      setError(null);
      setDialogOpen(false);
      setSelectedBank(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to add bank"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BankPayload }) =>
      updateBank(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setMessage("Bank updated successfully!");
      setError(null);
      setDialogOpen(false);
      setSelectedBank(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to update bank"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setMessage("Bank deleted successfully!");
      setDialogOpen(false);
      setSelectedBank(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to delete bank"));
    },
  });

  const handleOpenAdd = () => {
    setSelectedBank(null);
    setDialogOpen(true);
  };

  const handleRowClick = (bank: Bank) => {
    setSelectedBank(bank);
    setDialogOpen(true);
  };

  const handleFormSubmit = (data: {
    bank_code: string;
    name: string;
    address: string;
  }) => {
    const payload: BankPayload = {
      name: data.name,
      address: data.address || undefined,
      bank_code: data.bank_code.trim() || undefined,
    };
    if (selectedBank) {
      updateMutation.mutate({ id: selectedBank.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="Bank" subtitle="Bank account details" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Bank" subtitle="Bank account details" wide hideSave>
        <Alert severity="error">
          {getFriendlyErrorMessage(fetchError, "Failed to load banks")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell title="Bank" subtitle="Bank account details" wide hideSave>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, textAlign: "center" }}>
          Bank Details
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => refetch()}
              sx={{ color: "var(--pallet-blue)" }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add bank">
            <IconButton
              onClick={handleOpenAdd}
              sx={{
                color: "#fff",
                bgcolor: "var(--pallet-blue)",
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
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

      <TableContainer component={Paper} sx={{ boxShadow: "0 0 8px rgba(0,0,0,0.08)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Bank ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Bank Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Bank Address</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No banks yet. Click + to add a bank account.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              banks.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell>{row.bank_code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.address || ""}</TableCell>
                  <TableCell>
                    <ChevronRightIcon color="action" fontSize="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <BankFormDialog
        open={dialogOpen}
        bank={selectedBank}
        onClose={() => {
          setDialogOpen(false);
          setSelectedBank(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={
          selectedBank
            ? () => {
                deleteConfirm.requestDelete({
                  title: "Delete bank",
                  message: `Delete bank "${selectedBank.name}"? This cannot be undone.`,
                  onConfirm: () => deleteMutation.mutate(selectedBank.id),
                });
              }
            : undefined
        }
        isSaving={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default BankSettings;
