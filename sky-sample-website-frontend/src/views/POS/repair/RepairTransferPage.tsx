import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  executeRepairTransfer,
  getRepairTransferContext,
  searchRepairItems,
  type RepairItem,
} from "../../../api/repairApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";

export interface StagedLine {
  item_id: number;
  item_number: string;
  description: string;
  qty: number;
  from_location: string;
  to_location: string;
  max_qty: number;
}

interface RepairTransferPageProps {
  mode: "send" | "receive";
}

const RepairTransferPage: React.FC<RepairTransferPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<RepairItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [staged, setStaged] = useState<StagedLine[]>([]);
  const [toLocation, setToLocation] = useState("");
  const [fromLocation, setFromLocation] = useState("");

  const { data: context } = useQuery({
    queryKey: ["repair-context", mode],
    queryFn: () => getRepairTransferContext(mode),
  });

  const effectiveFrom =
    fromLocation ||
    context?.from_location ||
    (mode === "send" ? "Main Location" : "Repair");
  const effectiveTo =
    toLocation ||
    context?.to_location ||
    context?.to_locations?.[0] ||
    (mode === "send" ? "Repair" : "Main Location");

  const title = mode === "send" ? "Send To Repair Center" : "Receive From Repair Center";

  const transferMutation = useMutation({
    mutationFn: executeRepairTransfer,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      enqueueSnackbar("Transfer completed", { variant: "success" });
      setStaged([]);
      navigate("/repair");
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Transfer failed"), { variant: "error" });
    },
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const items = await searchRepairItems(search.trim(), effectiveFrom);
      setSearchResults(items);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Search failed"), { variant: "error" });
    } finally {
      setSearching(false);
    }
  };

  const addToStaged = (item: RepairItem, qty = 1) => {
    const q = Math.min(qty, item.qty);
    if (q <= 0) {
      enqueueSnackbar("No stock at source location", { variant: "warning" });
      return;
    }
    setStaged((prev) => {
      const existing = prev.find((l) => l.item_id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item_id === item.id
            ? { ...l, qty: Math.min(l.qty + q, item.qty) }
            : l
        );
      }
      return [
        ...prev,
        {
          item_id: item.id,
          item_number: item.item_number,
          description: item.description,
          qty: q,
          from_location: effectiveFrom,
          to_location: effectiveTo,
          max_qty: item.qty,
        },
      ];
    });
    setSearchResults([]);
    setSearch("");
  };

  const handleSend = () => {
    if (staged.length === 0) {
      enqueueSnackbar("Add items to the list first", { variant: "warning" });
      return;
    }
    transferMutation.mutate({
      transfer_type: mode,
      from_location: effectiveFrom,
      to_location: effectiveTo,
      lines: staged.map((l) => ({ item_id: l.item_id, qty: l.qty })),
    });
  };

  return (
    <Box sx={{ width: "100%", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid var(--surface-border)", display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton component={Link} to="/repair" size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>

      <Grid container sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={5} sx={{ borderRight: { md: "1px solid #e0e0e0" }, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, bgcolor: "var(--surface-bg-alt)" }}>
            <LocalShippingIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Items: {staged.length}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {staged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 8, color: "text.secondary", textAlign: "center" }}>
                      Search and add items on the right
                    </TableCell>
                  </TableRow>
                ) : (
                  staged.map((line) => (
                    <TableRow key={line.item_id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.item_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{line.description}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.qty}
                          inputProps={{ min: 0.01, max: line.max_qty, step: 0.01 }}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setStaged((prev) =>
                              prev.map((l) =>
                                l.item_id === line.item_id
                                  ? { ...l, qty: Math.min(Math.max(v || 0, 0.01), l.max_qty) }
                                  : l
                              )
                            );
                          }}
                          sx={{ width: 72 }}
                        />
                      </TableCell>
                      <TableCell>{line.from_location}</TableCell>
                      <TableCell>{line.to_location}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setStaged((prev) => prev.filter((l) => l.item_id !== line.item_id))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ p: 2, display: "flex", gap: 2, borderTop: "1px solid var(--surface-border)" }}>
            <Button variant="outlined" sx={{ flex: 1 }} disabled onClick={() => window.print()}>
              PRINT
            </Button>
            <Button
              variant="contained"
              sx={{
                flex: 2,
                fontWeight: 700,
                bgcolor: "var(--pallet-blue)",
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
              disabled={staged.length === 0 || transferMutation.isPending}
              onClick={handleSend}
            >
              {mode === "send" ? "SEND" : "RECEIVE"}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">From</Typography>
              {mode === "send" && context?.from_locations ? (
                <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                  <Select
                    value={fromLocation || context.from_location}
                    onChange={(e) => {
                      setFromLocation(e.target.value);
                      setStaged([]);
                      setSearchResults([]);
                    }}
                  >
                    {context.from_locations.map((loc) => (
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{effectiveFrom}</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={8}>
              {mode === "receive" && context?.to_locations ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>To Branch</InputLabel>
                  <Select
                    label="To Branch"
                    value={toLocation || context.to_location || effectiveTo}
                    onChange={(e) => {
                      setToLocation(e.target.value);
                      setStaged([]);
                    }}
                  >
                    {context.to_locations.map((loc) => (
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">To</Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{effectiveTo}</Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search item number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="contained" onClick={handleSearch} disabled={searching}>
              SEARCH
            </Button>
          </Box>

          {searchResults.length > 0 && (
            <Paper variant="outlined" sx={{ maxHeight: 320, overflow: "auto" }}>
              {searchResults.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "var(--surface-bg-alt)" },
                  }}
                  onClick={() => addToStaged(item)}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.item_number}</Typography>
                    <Typography variant="caption">{item.description}</Typography>
                  </Box>
                  <Typography variant="body2">Qty: {item.qty}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RepairTransferPage;
