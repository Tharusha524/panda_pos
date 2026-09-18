import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  executeStockTransfer,
  getStockTransferContext,
  searchStockTransferItems,
  type StockTransferItem,
  type StockTransferResult,
} from "../../../api/stockTransferApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";

interface StagedLine {
  item_id: number;
  item_number: string;
  description: string;
  qty: number;
  max_qty: number;
  /** Snapshot at staging time — the live before/after preview is computed from these. */
  from_before: number;
  to_before: number;
}

const StockTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<StockTransferItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [staged, setStaged] = useState<StagedLine[]>([]);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const { data: context } = useQuery({
    queryKey: ["stock-transfer-context"],
    queryFn: getStockTransferContext,
  });

  const locations = context?.locations ?? [];

  useEffect(() => {
    if (locations.length === 0) return;
    if (!fromLocation) setFromLocation(locations[0]);
    if (!toLocation) setToLocation(locations.find((l) => l !== locations[0]) ?? locations[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.join("|")]);

  const [result, setResult] = useState<StockTransferResult | null>(null);

  const transferMutation = useMutation({
    mutationFn: executeStockTransfer,
    onSuccess: (data) => {
      invalidatePosQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
      enqueueSnackbar("Stock transferred", { variant: "success" });
      setStaged([]);
      setResult(data);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Transfer failed"), { variant: "error" });
    },
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click (not on blur — blur fires before
  // a result's onClick registers, which would close it before the item gets
  // added).
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSearch = async () => {
    if (!fromLocation) return;
    setSearching(true);
    try {
      const items = await searchStockTransferItems(search.trim(), fromLocation, toLocation);
      setSearchResults(items);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Search failed"), { variant: "error" });
    } finally {
      setSearching(false);
    }
  };

  // Dropdown behaves as browse + search: opening it (click/focus) with no
  // text lists everything in stock at this location; typing narrows it
  // down. Re-queries as the user types, debounced so every keystroke
  // doesn't fire a request.
  useEffect(() => {
    if (!dropdownOpen || !fromLocation) {
      return;
    }
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, fromLocation, toLocation, dropdownOpen]);

  const addToStaged = (item: StockTransferItem) => {
    // Whole numbers only — these are countable item quantities, not
    // weight/volume, so no decimals.
    const maxQty = Math.floor(item.qty);
    if (maxQty <= 0) {
      enqueueSnackbar("No stock at source location", { variant: "warning" });
      return;
    }
    setStaged((prev) => {
      if (prev.some((l) => l.item_id === item.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          item_id: item.id,
          item_number: item.item_number,
          description: item.description,
          // Starts at 0 — the user types/spins the amount they actually
          // want to move, rather than it pre-filling with 1.
          qty: 0,
          max_qty: maxQty,
          from_before: maxQty,
          to_before: Math.floor(item.to_qty ?? 0),
        },
      ];
    });
    setSearchResults([]);
    setSearch("");
    setDropdownOpen(false);
  };

  const handleTransfer = () => {
    if (!fromLocation || !toLocation) {
      enqueueSnackbar("Pick both From and To locations", { variant: "warning" });
      return;
    }
    if (fromLocation === toLocation) {
      enqueueSnackbar("From and To must be different", { variant: "warning" });
      return;
    }
    if (staged.length === 0) {
      enqueueSnackbar("Add items to the list first", { variant: "warning" });
      return;
    }
    const lines = staged.filter((l) => l.qty > 0);
    if (lines.length === 0) {
      enqueueSnackbar("Enter a quantity for at least one item", { variant: "warning" });
      return;
    }
    transferMutation.mutate({
      from_location: fromLocation,
      to_location: toLocation,
      lines: lines.map((l) => ({ item_id: l.item_id, qty: l.qty })),
    });
  };

  return (
    <Box sx={{ width: "100%", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid var(--surface-border)", display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton component={Link} to="/inventory" size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Transfer Stock
        </Typography>
      </Box>

      <Grid container sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={5} sx={{ borderRight: { md: "1px solid #e0e0e0" }, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, bgcolor: "var(--surface-bg-alt)" }}>
            <SwapHorizIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Items: {staged.length}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fromLocation || "From"} (before → after)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {toLocation || "To"} (before → after)
                  </TableCell>
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
                          inputProps={{ min: 0, max: Math.floor(line.max_qty), step: 1 }}
                          onChange={(e) => {
                            const v = Math.round(parseFloat(e.target.value));
                            setStaged((prev) =>
                              prev.map((l) =>
                                l.item_id === line.item_id
                                  ? { ...l, qty: Math.min(Math.max(v || 0, 0), Math.floor(l.max_qty)) }
                                  : l
                              )
                            );
                          }}
                          sx={{ width: 72 }}
                        />
                      </TableCell>
                      {/* Live preview — recalculated from the qty field above on every keystroke. */}
                      <TableCell align="right" sx={{ color: "error.main", whiteSpace: "nowrap" }}>
                        <Typography variant="body2">
                          {line.from_before} → {line.from_before - line.qty}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main", whiteSpace: "nowrap" }}>
                        <Typography variant="body2">
                          {line.to_before} → {line.to_before + line.qty}
                        </Typography>
                      </TableCell>
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
          <Box sx={{ p: 2, borderTop: "1px solid var(--surface-border)" }}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                fontWeight: 700,
                bgcolor: "var(--pallet-blue)",
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
              disabled={staged.length === 0 || transferMutation.isPending}
              onClick={handleTransfer}
            >
              TRANSFER
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>From</InputLabel>
                <Select
                  label="From"
                  value={fromLocation}
                  onChange={(e) => {
                    setFromLocation(e.target.value);
                    setStaged([]);
                    setSearchResults([]);
                  }}
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>To</InputLabel>
                <Select
                  label="To"
                  value={toLocation}
                  onChange={(e) => {
                    setToLocation(e.target.value);
                    setStaged([]);
                  }}
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box ref={searchBoxRef} sx={{ position: "relative", mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Click to browse, or search item number / name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={!fromLocation}
                autoComplete="off"
              />
              <Button
                variant="contained"
                onClick={() => {
                  setDropdownOpen(true);
                  handleSearch();
                }}
                disabled={searching || !fromLocation}
              >
                SEARCH
              </Button>
            </Box>

            {dropdownOpen && (
              <Paper
                variant="outlined"
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  mt: 0.5,
                  maxHeight: 320,
                  overflow: "auto",
                  zIndex: 20,
                }}
              >
                {searching ? (
                  <Box sx={{ px: 2, py: 2, color: "text.secondary", textAlign: "center" }}>
                    <Typography variant="body2">Searching…</Typography>
                  </Box>
                ) : searchResults.length === 0 ? (
                  <Box sx={{ px: 2, py: 2, color: "text.secondary", textAlign: "center" }}>
                    <Typography variant="body2">
                      {search.trim() === ""
                        ? `No stock at ${fromLocation || "this location"}`
                        : `No items found at ${fromLocation || "this location"}`}
                    </Typography>
                  </Box>
                ) : (
                  searchResults.map((item) => (
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
                  ))
                )}
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={result !== null}
        onClose={() => {
          setResult(null);
          navigate("/inventory");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Transfer Complete</DialogTitle>
        <DialogContent dividers>
          {result && (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                {result.from_location} → {result.to_location} · {result.transfer_date}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Qty Moved</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {result.from_location} (before → after)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {result.to_location} (before → after)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.lines.map((line) => (
                    <TableRow key={line.item_number}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.item_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{line.description}</Typography>
                      </TableCell>
                      <TableCell align="right">{line.qty}</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        {line.from_before} → {line.from_after}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        {line.to_before} → {line.to_after}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setResult(null);
              navigate("/inventory");
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockTransferPage;
