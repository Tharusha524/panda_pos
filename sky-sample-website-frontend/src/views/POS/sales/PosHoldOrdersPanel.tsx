import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { deleteSale, getHoldOrders, type Sale } from "../../../api/salesApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { resolveStorageUrl } from "../../../utils/resolveStorageUrl";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { formatSaleRs } from "./saleFormUtils";
import { CATEGORY_DIALOG_PAPER_SX } from "../posDialogTheme";

interface PosHoldOrdersPanelProps {
  activeHoldSaleId: number | null;
  onResume: (sale: Sale) => void;
  onDeleted?: (saleId: number) => void;
  itemImageByNumber?: Map<string, string>;
}

function lineImageUrl(
  itemNumber: string | null | undefined,
  map: Map<string, string>
): string | null {
  if (!itemNumber?.trim()) return null;
  return map.get(itemNumber.trim().toLowerCase()) ?? null;
}

const PosHoldOrdersPanel: React.FC<PosHoldOrdersPanelProps> = ({
  activeHoldSaleId,
  onResume,
  onDeleted,
  itemImageByNumber = new Map(),
}) => {
  const [expanded, setExpanded] = useState(true);
  const [openHoldId, setOpenHoldId] = useState<number | null>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, isError, error } = useLiveQuery({
    queryKey: ["sales", "hold-orders"],
    queryFn: () => getHoldOrders(),
  });

  const holdOrders = data?.hold_orders ?? [];

  const deleteMutation = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin?: string }) => deleteSale(id, pin),
    onSuccess: (_data, { id }) => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Hold order deleted", { variant: "success" });
      onDeleted?.(id);
      closePinDialog();
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete hold order"), {
        variant: "error",
      });
    },
  });

  const closePinDialog = () => {
    setPinDialogOpen(false);
    setPinInput("");
    setPendingDelete(null);
  };

  const requestDelete = (sale: Sale) => {
    setPendingDelete(sale);
    setPinDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete || !pinInput.trim()) return;
    deleteMutation.mutate({ id: pendingDelete.id, pin: pinInput.trim() });
  };

  return (
    <>
      <Box sx={{ mt: 1.5, borderTop: "1px solid var(--surface-border)", pt: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setExpanded((v) => !v)}
        >
          <PauseIcon sx={{ fontSize: 18, color: "#ed6c02" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            Hold orders
          </Typography>
          <Chip
            label={isLoading ? "…" : holdOrders.length}
            size="small"
            color="warning"
            sx={{ height: 22, fontWeight: 700, fontSize: "0.7rem" }}
          />
          <IconButton size="small" aria-label={expanded ? "Collapse hold orders" : "Expand hold orders"}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 0.75, maxHeight: 280, overflow: "auto" }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                <CircularProgress size={22} sx={{ color: "var(--pallet-blue)" }} />
              </Box>
            ) : isError ? (
              <Typography variant="caption" color="error">
                {getFriendlyErrorMessage(error, "Could not load hold orders")}
              </Typography>
            ) : holdOrders.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 0.5 }}>
                No orders on hold.
              </Typography>
            ) : (
              holdOrders.map((sale) => {
                const isActive = activeHoldSaleId === sale.id;
                const isOpen = openHoldId === sale.id;
                const items = sale.items ?? [];
                return (
                  <Box
                    key={sale.id}
                    sx={{
                      mb: 0.85,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: isActive ? "#1565c0" : "#dbe3ec",
                      bgcolor: isActive ? "#e8f0fe" : "#fff",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.85,
                        cursor: "pointer",
                        borderBottom: isOpen ? "1px solid #edf2f7" : "none",
                      }}
                      onClick={() => setOpenHoldId((prev) => (prev === sale.id ? null : sale.id))}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: "block" }}>
                            {sale.sales_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {sale.customer_name || "Walk-in"} · {sale.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {sale.sale_datetime ?? sale.sale_date} · {items.length} item
                            {items.length === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#c62828", whiteSpace: "nowrap" }}>
                          {formatSaleRs(sale.net_amount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Collapse in={isOpen}>
                      <Box sx={{ px: 1, py: 0.75, bgcolor: "var(--surface-bg-alt)" }}>
                        {items.map((line, idx) => {
                          const img = lineImageUrl(line.item_number, itemImageByNumber);
                          return (
                            <Box
                              key={line.id ?? `${sale.id}-${idx}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                py: 0.45,
                                borderBottom:
                                  idx < items.length - 1 ? "1px dashed #e5e7eb" : "none",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 1,
                                  bgcolor: "var(--surface-bg-alt)",
                                  overflow: "hidden",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {img ? (
                                  <Box
                                    component="img"
                                    src={img}
                                    alt={line.description}
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: "0.55rem", fontWeight: 700 }}>
                                    {line.item_number ?? "—"}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap display="block">
                                  {line.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {line.qty} × {formatSaleRs(line.unit_price)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {formatSaleRs(line.line_total)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>

                    <Box sx={{ display: "flex", gap: 0.5, p: 0.75, pt: isOpen ? 0.75 : 0 }}>
                      <Button
                        size="small"
                        variant={isActive ? "contained" : "outlined"}
                        startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
                        onClick={() => onResume(sale)}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          py: 0.35,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          textTransform: "none",
                        }}
                      >
                        {isActive ? "Active" : "Resume"}
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Delete hold order ${sale.sales_id}`}
                        onClick={() => requestDelete(sale)}
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Collapse>
      </Box>

      <Dialog
        open={pinDialogOpen}
        onClose={closePinDialog}
        maxWidth="xs"
        fullWidth
        sx={CATEGORY_DIALOG_PAPER_SX}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Hold order PIN</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter PIN to delete hold order {pendingDelete?.sales_id ?? ""}.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="PIN"
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closePinDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={!pinInput.trim() || deleteMutation.isPending}
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PosHoldOrdersPanel;
