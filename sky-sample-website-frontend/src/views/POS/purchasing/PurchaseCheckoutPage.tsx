import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
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
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import { Link } from "react-router";
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { setActiveLocation } from "../../../utils/posActiveLocation";
import PurchaseChequeFields from "./PurchaseChequeFields";
import PurchaseSupplierSelectArea from "./PurchaseSupplierSelectArea";
import { usePurchaseSession } from "./purchaseContext";
import {
  formatPurchaseRs,
  PURCHASES_BASE,
} from "./purchaseFormUtils";
import { DEFAULT_PURCHASE_TYPE, NET_TERMS_OPTIONS, PURCHASE_TYPE_RETURN, purchaseTypeLabel, WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";
import { POS_PAYMENT_OPTIONS, type PosPaymentMethod } from "../sales/posSaleConstants";
import {
  formatAfterStock,
  formatAvailableStock,
  purchaseAvailableForLine,
  purchasePaymentEffectLabel,
} from "./purchaseStockUtils";
import { formatUomLabel, qtyInputPropsForUom } from "../sales/posSaleUom";

const PurchaseCheckoutPage: React.FC = () => {
  const s = usePurchaseSession();
  const isReturn = s.form.purchase_type === PURCHASE_TYPE_RETURN;

  const returnLineTotals = useMemo(() => {
    if (!isReturn) return null;
    return s.lines.reduce(
      (acc, line) => ({
        purchased: acc.purchased + Number(line.purchased_qty ?? line.qty ?? 0),
        returned: acc.returned + Number(line.returned_qty ?? 0),
        remaining: acc.remaining + Number(line.max_return_qty ?? line.qty ?? 0),
        returning: acc.returning + Number(line.qty ?? 0),
      }),
      { purchased: 0, returned: 0, remaining: 0, returning: 0 }
    );
  }, [isReturn, s.lines]);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "var(--surface-bg-alt)", p: { xs: 0.75, sm: 1 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => s.setView("products")}
          sx={{ textTransform: "none" }}
        >
          Add Products
        </Button>
        <Button component={Link} to={PURCHASES_BASE} size="small" sx={{ textTransform: "none" }}>
          Purchasing List
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          {isReturn ? "Complete Purchase Return" : "Complete Purchase"} · {s.form.invoice_id || "…"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {s.itemBranch}
        </Typography>
      </Box>

      {s.errors.products ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {s.errors.products}
        </Alert>
      ) : null}

      {isReturn && returnLineTotals ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Return quantities
          </Typography>
          <Typography variant="body2">
            Purchased: <strong>{returnLineTotals.purchased}</strong>
            {" · "}Already returned: <strong>{returnLineTotals.returned}</strong>
            {" · "}Remaining to return: <strong>{returnLineTotals.remaining}</strong>
            {" · "}This return: <strong>{returnLineTotals.returning}</strong>
          </Typography>
        </Alert>
      ) : null}

      {!isReturn ? (
      <Alert severity="info" sx={{ mb: 1.5 }}>
        <strong>Expiry (optional):</strong> leave blank to add qty to <strong>main item stock</strong>.
        Enter a date only when this delivery is a <strong>new dated batch</strong> (e.g. after write-off of
        expired stock).
      </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #cfd8e3",
              bgcolor: "var(--surface-bg)",
              minHeight: { lg: "calc(100vh - 120px)" },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {isReturn ? "Return lines" : "Purchase lines"} ({s.lines.length})
            </Typography>
            <TableContainer sx={{ maxHeight: { lg: "calc(100vh - 200px)" } }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Product</TableCell>
                    {isReturn ? (
                      <>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 72 }}>
                          Bought
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 72 }}>
                          Returned
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--tint-warning-bg)", width: 80 }}>
                          Left
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                          Price
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--tint-danger-bg)", width: 170 }}>
                          Return qty
                        </TableCell>
                      </>
                    ) : (
                      <>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 100 }}>
                      Available
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                      Cost
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 150 }}>
                      Expiry
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 170 }}>
                      Buy qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 100 }}>
                      After stock
                    </TableCell>
                      </>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                      Total
                    </TableCell>
                    <TableCell align="center" sx={{ width: 48, bgcolor: "var(--surface-bg-alt)" }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isReturn ? 8 : 8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No products yet. Go back and add items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    s.lines.map((line) => {
                      const uom = s.lineUom(line);
                      const qtyInput = qtyInputPropsForUom(uom);
                      const catalogItem = s.catalogItems.find((i) => i.id === line.item_id);
                      const available = purchaseAvailableForLine(s.catalogItems, line);
                      const maxReturn = line.max_return_qty ?? line.qty;
                      return (
                        <TableRow key={line.key} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {line.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.item_number}
                            </Typography>
                          </TableCell>
                          {isReturn ? (
                            <>
                              <TableCell align="right">
                                <Typography variant="body2">{line.purchased_qty ?? "—"}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">
                                  {line.returned_qty ?? 0}
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ bgcolor: "var(--tint-warning-bg)" }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.dark" }}>
                                  {maxReturn}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatPurchaseRs(line.unit_price)}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                                  <IconButton size="small" onClick={() => s.updateLineQty(line.key, -1)}>
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={line.qty}
                                    onChange={(e) =>
                                      s.setLineQty(line.key, parseFloat(e.target.value) || 0)
                                    }
                                    inputProps={{ min: qtyInput.min, max: maxReturn, step: qtyInput.step }}
                                    sx={{ width: 72, "& input": { textAlign: "center", py: 0.5 } }}
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 20 }}>
                                    {formatUomLabel(uom)}
                                  </Typography>
                                  <IconButton size="small" onClick={() => s.updateLineQty(line.key, 1)}>
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </>
                          ) : (
                            <>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {catalogItem ? formatAvailableStock(catalogItem) : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={line.unit_price}
                              onChange={(e) =>
                                s.updateLinePrice(line.key, parseFloat(e.target.value) || 0)
                              }
                              inputProps={{ min: 0, step: "0.01" }}
                              sx={{ width: 96 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              / {formatUomLabel(uom)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="date"
                              value={line.expiry_date ?? ""}
                              onChange={(e) =>
                                s.updateLineExpiry(line.key, e.target.value || null)
                              }
                              InputLabelProps={{ shrink: true }}
                              placeholder="Optional"
                              helperText={
                                line.expiry_date
                                  ? "New batch"
                                  : catalogItem?.expired_stock_qty
                                    ? "Main stock"
                                    : undefined
                              }
                              FormHelperTextProps={{ sx: { m: 0, fontSize: 10 } }}
                              sx={{ width: 140, "& input": { py: 0.5, fontSize: 12 } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.25,
                              }}
                            >
                              <IconButton size="small" onClick={() => s.updateLineQty(line.key, -1)}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                size="small"
                                type="number"
                                value={line.qty}
                                onChange={(e) =>
                                  s.setLineQty(line.key, parseFloat(e.target.value) || 0)
                                }
                                inputProps={{ min: qtyInput.min, step: qtyInput.step }}
                                sx={{ width: 72, "& input": { textAlign: "center", py: 0.5 } }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 20 }}>
                                {formatUomLabel(uom)}
                              </Typography>
                              <IconButton size="small" onClick={() => s.updateLineQty(line.key, 1)}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1565c0" }}>
                              {formatAfterStock(available, line.qty, uom)}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              +{line.qty} {formatUomLabel(uom)}
                            </Typography>
                          </TableCell>
                            </>
                          )}
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatPurchaseRs(line.line_total)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => s.removeLine(line.key)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 700, mt: 1.5, pt: 1, borderTop: "1px solid #eee" }}>
              Subtotal: {formatPurchaseRs(s.linesSubTotal)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid #cfd8e3",
              bgcolor: "var(--surface-bg-alt)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Alert severity="info" sx={{ py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Expiry &amp; stock
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                <strong>No expiry</strong> → qty adds to main item stock at {s.itemBranch}.{" "}
                <strong>With expiry</strong> → creates/merges a dated batch (use after write-off of
                expired stock).
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                When you save this purchase:
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>{isReturn ? "Stock decreases" : "Stock increases"}</strong> by each{" "}
                {isReturn ? "return" : "buy"} qty at {s.itemBranch}
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>{formatPurchaseRs(s.purchaseAmount)}</strong>{" "}
                {purchasePaymentEffectLabel(s.form.payment_method, isReturn)}
              </Typography>
            </Alert>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Supplier & Payment
            </Typography>

            {s.manageMultiple ? (
              <BranchLocationSelect
                branchesOnly
                value={s.itemBranch}
                onChange={(loc) => {
                  if (loc === "all") return;
                  setActiveLocation(loc);
                  s.setField("location", loc);
                }}
                label="Branch (stock)"
              />
            ) : null}

            <PurchaseSupplierSelectArea
              suppliers={s.suppliers}
              isLoading={s.loadingSuppliers}
              selectedSupplierId={s.form.supplier_id ?? null}
              selectedSupplierName={s.form.supplier_name}
              error={s.errors.supplier_name}
              onSelect={(supplier) => {
                s.setForm((prev) => ({
                  ...prev,
                  supplier_id: supplier?.id ?? null,
                  supplier_name: supplier
                    ? s.supplierDisplayName(supplier)
                    : WALK_IN_SUPPLIER_LABEL,
                }));
                if (s.errors.supplier_name) s.clearError("supplier_name");
              }}
            />

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date"
                  type="date"
                  required
                  value={s.form.purchase_date ?? ""}
                  onChange={(e) => s.setField("purchase_date", e.target.value)}
                  error={!!s.errors.purchase_date}
                  helperText={s.errors.purchase_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Invoice"
                  value={s.form.invoice_id}
                  onChange={(e) => s.setField("invoice_id", e.target.value)}
                  error={!!s.errors.invoice_id}
                  helperText={s.errors.invoice_id}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Purchase Type</InputLabel>
                  <Select
                    label="Purchase Type"
                    value={s.form.purchase_type ?? DEFAULT_PURCHASE_TYPE}
                    onChange={(e) => s.setField("purchase_type", e.target.value)}
                    notched
                  >
                    {s.purchaseTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {purchaseTypeLabel(t)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ bgcolor: "var(--surface-bg)", borderRadius: 1, p: 1.5, border: "1px solid var(--surface-border)" }}>
              <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <span>Sub Total</span>
                <strong>{s.linesSubTotal.toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <span>Discount</span>
                <strong>{(s.form.discount ?? 0).toFixed(2)}</strong>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  color: "#c62828",
                  pt: 1,
                  borderTop: "1px solid #eee",
                }}
              >
                <span>Total</span>
                <span>{formatPurchaseRs(s.computedAmount)}</span>
              </Typography>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={s.form.payment_method === "Cheque" ? 12 : 6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Discount"
                  type="number"
                  value={s.form.discount}
                  onChange={(e) => s.setField("discount", parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  inputProps={{ min: 0, step: "0.01" }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {s.form.payment_method !== "Cheque" ? (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Purchase Amount"
                    type="number"
                    value={s.purchaseAmount}
                    onChange={(e) => {
                      s.setPurchaseAmount(parseFloat(e.target.value) || 0);
                      if (s.errors.amount) s.clearError("amount");
                    }}
                    disabled={s.form.payment_method === "Credit"}
                    error={!!s.errors.amount}
                    helperText={
                      s.errors.amount ??
                      (s.form.payment_method === "Credit"
                        ? "Full amount on credit"
                        : "Amount paid to supplier")
                    }
                    InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                    inputProps={{ min: 0, step: "0.01" }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              ) : null}
            </Grid>

            <FormControl fullWidth size="small">
              <InputLabel shrink>Payment method</InputLabel>
              <Select
                label="Payment method"
                value={s.form.payment_method ?? "Cash"}
                onChange={(e) => s.handlePaymentSelect(e.target.value as PosPaymentMethod)}
                notched
              >
                {(s.paymentMethods.length > 0
                  ? s.paymentMethods
                  : POS_PAYMENT_OPTIONS.map((o) => o.value)
                ).map((m) => (
                  <MenuItem key={m} value={m}>
                    {POS_PAYMENT_OPTIONS.find((o) => o.value === m)?.label ?? m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {POS_PAYMENT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="medium"
                  onClick={() => s.handlePaymentSelect(opt.value)}
                  color={s.form.payment_method === opt.value ? "primary" : "default"}
                  variant={s.form.payment_method === opt.value ? "filled" : "outlined"}
                />
              ))}
            </Box>

            {(s.form.payment_method === "Credit" || s.form.payment_method === "Cheque") && (
              <FormControl fullWidth size="small">
                <InputLabel shrink>Net terms</InputLabel>
                <Select
                  label="Net terms"
                  value={s.form.net_terms ?? ""}
                  onChange={(e) => s.setField("net_terms", e.target.value)}
                  notched
                >
                  {NET_TERMS_OPTIONS.map((term) => (
                    <MenuItem key={term} value={term}>
                      {term}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {s.form.payment_method === "Cheque" ? (
              <PurchaseChequeFields
                banks={s.banks}
                loadingBanks={s.loadingBanks}
                bankId={s.form.bank_id ?? null}
                chequeNumber={s.form.cheque_number ?? ""}
                chequeAmount={s.purchaseAmount}
                bankError={s.errors.bank_id}
                chequeNumberError={s.errors.cheque_number}
                amountError={s.errors.amount}
                onBankChange={(bankId) => s.setField("bank_id", bankId)}
                onChequeNumberChange={(chequeNumber) =>
                  s.setField("cheque_number", chequeNumber)
                }
                onChequeAmountChange={s.setPurchaseAmount}
                onClearError={s.clearError}
              />
            ) : null}

            <TextField
              fullWidth
              size="small"
              label="Notes"
              multiline
              minRows={2}
              value={s.form.notes ?? ""}
              onChange={(e) => s.setField("notes", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                disabled={s.printInvoicePending || s.lines.length === 0}
                onClick={s.handlePrintInvoice}
                startIcon={
                  s.printInvoicePending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PrintIcon />
                  )
                }
                sx={{ textTransform: "none" }}
              >
                {s.printInvoicePending ? "Preparing…" : "Print Invoice"}
              </Button>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button component={Link} to={PURCHASES_BASE} fullWidth variant="outlined" sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={s.savePending}
                  onClick={s.handleSubmit}
                  startIcon={
                    s.savePending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                  }
                  sx={{ bgcolor: "#0b7a45", textTransform: "none", "&:hover": { bgcolor: "#09673b" } }}
                >
                  {s.savePending ? "Saving…" : "Save Purchase"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseCheckoutPage;
