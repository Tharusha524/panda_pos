import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { getItems } from "../../../../api/itemsApi";
import {
  assignVatToItems,
  formatVatRateLabel,
  type VatRate,
} from "../../../../api/Settings/taxSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";

interface AssignVatToItemsDialogProps {
  open: boolean;
  onClose: () => void;
  vatRates: VatRate[];
  onAssigned: () => void;
}

const AssignVatToItemsDialog: React.FC<AssignVatToItemsDialogProps> = ({
  open,
  onClose,
  vatRates,
  onAssigned,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [vatRateId, setVatRateId] = useState<number | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["items", "assign-vat"],
    queryFn: () => getItems(undefined, "all"),
    enabled: open,
  });

  const items = useMemo(() => {
    const rows = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.item_number.toLowerCase().includes(q)
    );
  }, [data?.items, search]);

  const assignMutation = useMutation({
    mutationFn: () =>
      assignVatToItems(
        selectedIds,
        vatRateId === "" ? null : Number(vatRateId)
      ),
    onSuccess: () => {
      enqueueSnackbar("VAT assigned to selected items", { variant: "success" });
      setSelectedIds([]);
      onAssigned();
      onClose();
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to assign VAT"), {
        variant: "error",
      });
    },
  });

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((i) => i.id) : []);
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Assign VAT to items</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2, mt: 0.5 }}>
          <TextField
            size="small"
            label="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>VAT rate</InputLabel>
            <Select
              label="VAT rate"
              value={vatRateId}
              onChange={(e) =>
                setVatRateId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <MenuItem value="">
                <em>Clear VAT</em>
              </MenuItem>
              {vatRates.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {formatVatRateLabel(r)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 360, border: "1px solid var(--surface-border)" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={items.length > 0 && selectedIds.length === items.length}
                      indeterminate={
                        selectedIds.length > 0 && selectedIds.length < items.length
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Item #</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>VAT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        No items found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const rate = vatRates.find((r) => r.id === item.vat_rate_id);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleOne(item.id)}
                          />
                        </TableCell>
                        <TableCell>{item.item_number}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          {rate ? formatVatRateLabel(rate) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={selectedIds.length === 0 || assignMutation.isPending}
          onClick={() => assignMutation.mutate()}
          sx={{ bgcolor: "#0b7a45", "&:hover": { bgcolor: "#09673b" } }}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignVatToItemsDialog;
