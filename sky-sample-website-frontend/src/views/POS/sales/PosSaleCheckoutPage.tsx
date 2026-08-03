import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
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
import PaymentsIcon from "@mui/icons-material/Payments";
import PrintIcon from "@mui/icons-material/Print";
import RemoveIcon from "@mui/icons-material/Remove";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PosCustomerSelectArea from "./PosCustomerSelectArea";
import PosHoldOrdersPanel from "./PosHoldOrdersPanel";
import SaleOfferSection from "./SaleOfferSection";
import { usePosSale } from "./posSaleContext";
import { formatExpiryDate } from "../inventory/itemInventoryUtils";
import { formatPricePerUom, formatUomLabel, formatStockQty, qtyInputPropsForUom } from "./posSaleUom";
import { formatSaleRs, SALES_BASE } from "./saleFormUtils";
import { wholeStockPrice, saleUnitPriceLabel } from "./posSalePricing";
import CartOffersSummary from "./CartOffersSummary";
import {
  cartLineDisplayPricing,
  resolveCartLineOfferDisplay,
} from "./saleOfferLineDisplay";
import { POS_PAYMENT_OPTIONS } from "./posSaleConstants";
import PosSalesTypeToggle from "./PosSalesTypeToggle";
import CustomerReceivePaymentDialog from "../customers/CustomerReceivePaymentDialog";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { formatDashboardRs } from "../shared/dashboardShared";

const PosSaleCheckoutPage: React.FC = () => {
  const s = usePosSale();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [receivePaymentOpen, setReceivePaymentOpen] = useState(false);

  const selectedCustomer = useMemo(
    () => s.customers.find((c) => c.id === s.form.customer_id) ?? null,
    [s.customers, s.form.customer_id]
  );
  const productOfferActive =
    Boolean(s.form.offer_id) && s.selectedOffer?.discount_type === "product";
  const matchingProductOffers = s.offerEngine.matchingProductOffers;
  const orderOffers = s.offerEngine.orderOffers;
  const cartProductOffers =
    s.lines.length > 0
      ? matchingProductOffers
      : s.applicableOffers.filter((offer) => offer.discount_type === "product");
  const cartOrderOffers =
    s.lines.length > 0
      ? orderOffers
      : s.applicableOffers.filter((offer) => offer.discount_type === "order");
  const orderOfferActive =
    Boolean(s.form.offer_id) && s.selectedOffer?.discount_type === "order";
  const displaySubTotal =
    productOfferActive && s.offerPreview?.sub_total != null && s.offerDiscount > 0
      ? s.offerPreview.sub_total
      : s.linesSubTotal;
  const showSeparateOfferLine =
    Boolean(s.form.offer_id) &&
    s.offerDiscount > 0 &&
    !(productOfferActive && displaySubTotal < s.linesSubTotal - 0.009);

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
        <Button
          component={Link}
          to={SALES_BASE}
          size="small"
          sx={{ textTransform: "none" }}
        >
          Sales List
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          Complete Sale · {s.form.sales_id || "…"}
          {s.activeHoldSaleId ? (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, color: "#ed6c02", fontWeight: 700 }}
            >
              (Hold)
            </Typography>
          ) : null}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {s.itemBranch}
          {s.form.customer_name ? ` · ${s.form.customer_name}` : ""}
        </Typography>
      </Box>

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                Cart ({s.lines.length} item{s.lines.length === 1 ? "" : "s"})
              </Typography>
              {s.allowPriceSwitch ? (
                <PosSalesTypeToggle
                  value={s.salesPriceMode}
                  onChange={s.handleSalesPriceModeChange}
                  allowWholesale={s.allowWholesalePrice}
                  compact
                />
              ) : null}
            </Box>

            {(cartProductOffers.length > 0 || cartOrderOffers.length > 0) ? (
              <CartOffersSummary
                productOffers={cartProductOffers}
                orderOffers={cartOrderOffers}
                qualifyingOrderOfferIds={s.offerEngine.qualifyingOrderOfferIds}
                selectedOfferId={s.form.offer_id}
                selectedOfferType={
                  productOfferActive ? "product" : orderOfferActive ? "order" : null
                }
                subTotal={s.linesSubTotal}
                compact={s.lines.length > 0}
              />
            ) : null}

            <TableContainer sx={{ maxHeight: { lg: "calc(100vh - 280px)" } }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 56 }}>
                      Img
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                      {saleUnitPriceLabel(s.salesPriceMode)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 140 }}>
                      Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                      Total
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 48 }}>
                      {" "}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No items yet. Go back and add products.
                      </TableCell>
                    </TableRow>
                  ) : (
                    s.lines.map((line, lineIndex) => {
                      const thumb = s.lineImageUrl(line.item_number);
                      const uom = s.lineUom(line);
                      const qtyInput = qtyInputPropsForUom(uom);
                      const lineOffer = resolveCartLineOfferDisplay(
                        line,
                        lineIndex,
                        matchingProductOffers,
                        productOfferActive,
                        productOfferActive ? s.selectedOffer : null,
                        s.offerPreview
                      );
                      const pricing =
                        lineOffer?.pricing.hasOffer &&
                        productOfferActive &&
                        s.selectedOffer?.id === lineOffer.offer.id
                          ? lineOffer.pricing
                          : cartLineDisplayPricing(
                              line,
                              lineIndex,
                              s.offerPreview,
                              productOfferActive
                            );
                      const showOfferPrice = lineOffer?.pricing.hasOffer ?? false;
                      const displayUnitPrice = showOfferPrice
                        ? lineOffer!.pricing.unitPrice
                        : pricing.unitPrice;
                      const displayLineTotal = showOfferPrice
                        ? lineOffer!.pricing.lineTotal
                        : line.line_total;
                      const stockQty = line.batch_stock_qty;
                      const wholePrice = wholeStockPrice(line.unit_price, stockQty);
                      const offerWholePrice = showOfferPrice
                        ? wholeStockPrice(displayUnitPrice, stockQty)
                        : null;
                      return (
                        <TableRow
                          key={line.key}
                          hover
                          sx={showOfferPrice ? { bgcolor: "var(--tint-success-bg)" } : undefined}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1,
                                bgcolor: "var(--surface-bg-alt)",
                                overflow: "hidden",
                                border: "1px solid var(--surface-border)",
                              }}
                            >
                              {thumb ? (
                                <Box
                                  component="img"
                                  src={thumb}
                                  alt={line.description}
                                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.5rem", fontWeight: 700, p: 0.25 }}
                                >
                                  {line.item_number ?? "—"}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {line.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {line.item_number}
                            </Typography>
                            {line.batch_id ? (
                              <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.25 }}>
                                Batch: {line.batch_id}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.25 }}>
                                Unbatched stock
                              </Typography>
                            )}
                            {lineOffer ? (
                              <Box
                                sx={{
                                  mt: 0.5,
                                  p: 0.75,
                                  borderRadius: 1,
                                  bgcolor: "var(--tint-success-bg)",
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 700, color: "#166534", display: "block" }}
                                >
                                  {lineOffer.offer.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {lineOffer.scopeLabel}
                                </Typography>
                                {showOfferPrice ? (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#15803d", fontWeight: 700, display: "block", mt: 0.25 }}
                                  >
                                    Unit offer price: {formatSaleRs(displayUnitPrice)}
                                    {displayUnitPrice < line.unit_price ? (
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ ml: 0.5, textDecoration: "line-through", fontWeight: 400 }}
                                      >
                                        {formatSaleRs(line.unit_price)}
                                      </Typography>
                                    ) : null}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                    {lineOffer.offer.discount_summary ??
                                      (lineOffer.offer.product_percent_off
                                        ? `${lineOffer.offer.product_percent_off}% off`
                                        : "Offer applies to this line")}
                                  </Typography>
                                )}
                              </Box>
                            ) : null}
                            {stockQty != null && wholePrice != null ? (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Whole price ({formatStockQty(stockQty, uom)} stock):{" "}
                                <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>
                                  {formatSaleRs(wholePrice)}
                                </Typography>
                                {offerWholePrice != null && offerWholePrice < wholePrice ? (
                                  <>
                                    {" → "}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{ fontWeight: 700, color: "success.main" }}
                                    >
                                      Offer {formatSaleRs(offerWholePrice)}
                                    </Typography>
                                  </>
                                ) : null}
                              </Typography>
                            ) : null}
                            <Box sx={{ mt: 0.25 }}>
                              {line.batch_id && line.batch_expiry_date ? (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Expiry: {formatExpiryDate(line.batch_expiry_date)}
                                </Typography>
                              ) : null}
                              {line.purchase_price != null && line.purchase_price > 0 ? (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Purchase: {formatSaleRs(line.purchase_price)}
                                </Typography>
                              ) : null}
                              {(line.batch_selling_price != null || line.unit_price > 0) && !showOfferPrice ? (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {s.salesPriceMode === "Wholesale" ? "Wholesale" : "Selling"}:{" "}
                                  {formatSaleRs(line.unit_price)}
                                </Typography>
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {s.allowEditSellingPrice && !showOfferPrice ? (
                              <TextField
                                size="small"
                                type="number"
                                value={line.unit_price}
                                onChange={(e) => {
                                  const parsed = parseFloat(e.target.value);
                                  if (!Number.isNaN(parsed)) {
                                    s.setLineUnitPrice(line.key, parsed);
                                  }
                                }}
                                inputProps={{ min: 0, step: "0.01" }}
                                sx={{ width: 100, "& input": { textAlign: "right", py: 0.5 } }}
                              />
                            ) : s.allowEditSellingPrice && showOfferPrice ? (
                              <Box>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={line.unit_price}
                                  onChange={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    if (!Number.isNaN(parsed)) {
                                      s.setLineUnitPrice(line.key, parsed);
                                    }
                                  }}
                                  inputProps={{ min: 0, step: "0.01" }}
                                  sx={{ width: 100, "& input": { textAlign: "right", py: 0.5 } }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#15803d", fontWeight: 700, display: "block", mt: 0.25 }}
                                >
                                  Offer: {formatPricePerUom(displayUnitPrice, uom)}
                                </Typography>
                              </Box>
                            ) : showOfferPrice && displayUnitPrice < line.unit_price ? (
                              <>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ textDecoration: "line-through" }}
                                >
                                  {formatPricePerUom(line.unit_price, uom)}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                                  {formatPricePerUom(displayUnitPrice, uom)}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2">
                                {formatPricePerUom(displayUnitPrice, uom)}
                              </Typography>
                            )}
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
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  if (raw === "" || raw === "0") {
                                    s.setLineQty(line.key, 0);
                                    return;
                                  }
                                  const parsed = parseFloat(raw);
                                  if (!Number.isNaN(parsed)) {
                                    s.setLineQty(line.key, parsed);
                                  }
                                }}
                                inputProps={{ min: qtyInput.min, step: qtyInput.step }}
                                title="Enter 0 to remove this item"
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
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: showOfferPrice ? "success.main" : undefined,
                              }}
                            >
                              {formatSaleRs(displayLineTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                s.setLines((prev) => prev.filter((l) => l.key !== line.key))
                              }
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
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Customer & Payment
            </Typography>

            <PosCustomerSelectArea
              customers={s.customers}
              isLoading={s.loadingCustomers}
              selectedCustomerId={s.form.customer_id ?? null}
              selectedCustomerName={s.form.customer_name}
              onSelect={(customer) => {
                s.setForm((prev) => ({
                  ...prev,
                  customer_id: customer?.id ?? null,
                  customer_name: customer ? s.customerDisplayName(customer) : "",
                }));
                s.savePosSelectedCustomer(customer);
              }}
            />

            {selectedCustomer && selectedCustomer.net_balance > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  p: 1.25,
                  bgcolor: "var(--tint-warning-bg)",
                  borderRadius: 1,
                  border: "1px solid #fed7aa",
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Credit balance
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#c2410c" }}>
                    {formatDashboardRs(selectedCustomer.net_balance)}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PaymentsIcon />}
                  onClick={() => setReceivePaymentOpen(true)}
                  sx={{
                    textTransform: "none",
                    bgcolor: "var(--pallet-blue)",
                    "&:hover": { bgcolor: "var(--pallet-main-blue)" },
                  }}
                >
                  Receive Payment
                </Button>
              </Box>
            ) : null}

            {s.showOffers ? (
              <SaleOfferSection
                allowOffers={s.showOffers}
                applicableOffers={s.applicableOffers}
                offerId={s.form.offer_id}
                offerPromoCode={s.form.offer_promo_code}
                onOfferChange={(patch) => s.setForm((prev) => ({ ...prev, ...patch }))}
                engine={s.offerEngine}
              />
            ) : null}

            <Box sx={{ bgcolor: "var(--surface-bg)", borderRadius: 1, p: 1.5, border: "1px solid var(--surface-border)" }}>
              <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <span>Sub Total</span>
                <strong>{displaySubTotal.toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <span>Manual discount</span>
                <strong>−{(s.form.discount ?? 0).toFixed(2)}</strong>
              </Typography>
              {showSeparateOfferLine && (s.offerDiscount > 0 || s.offerUpdating) ? (
                <Typography
                  variant="body2"
                  sx={{ display: "flex", justifyContent: "space-between", color: "success.main", mb: 0.5 }}
                >
                  <span>
                    Offer discount
                    {s.selectedOffer ? ` (${s.selectedOffer.name})` : ""}
                    {s.offerUpdating ? " · updating…" : ""}
                  </span>
                  <strong>−{s.offerDiscount.toFixed(2)}</strong>
                </Typography>
              ) : null}
              {s.vatBreakdown.applied && s.vatBreakdown.vatAmount > 0 ? (
                <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <span>VAT{s.vatBreakdown.vatLabel ? ` (${s.vatBreakdown.vatLabel})` : ""}</span>
                  <strong>{s.vatBreakdown.vatAmount.toFixed(2)}</strong>
                </Typography>
              ) : null}
              {s.allowDeliveryCharge ? (
                <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <span>Delivery cost</span>
                  <strong>{(s.form.service_charge ?? 0).toFixed(2)}</strong>
                </Typography>
              ) : null}
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
                <span>{formatSaleRs(s.netAmount)}</span>
              </Typography>
              {s.paymentMethod === "Cash" && s.changeDue > 0 ? (
                <Typography variant="body2" sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <span>Change</span>
                  <strong>{formatSaleRs(s.changeDue)}</strong>
                </Typography>
              ) : null}
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={s.allowDeliveryCharge ? 4 : 6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Manual discount"
                  type="number"
                  value={s.form.discount ?? 0}
                  onChange={(e) =>
                    s.setForm((prev) => ({
                      ...prev,
                      discount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              {s.allowDeliveryCharge ? (
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Delivery cost"
                    type="number"
                    value={s.form.service_charge ?? 0}
                    onChange={(e) =>
                      s.setForm((prev) => ({
                        ...prev,
                        service_charge: parseFloat(e.target.value) || 0,
                      }))
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                    helperText="Added to total"
                  />
                </Grid>
              ) : null}
              <Grid item xs={s.allowDeliveryCharge ? 4 : 6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount Received"
                  type="number"
                  value={s.paymentMethod === "Credit" ? s.netAmount : s.amountReceived}
                  onChange={(e) => s.setAmountReceived(parseFloat(e.target.value) || 0)}
                  disabled={s.paymentMethod === "Credit"}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {POS_PAYMENT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="medium"
                  onClick={() => s.handlePaymentSelect(opt.value)}
                  color={s.paymentMethod === opt.value ? "primary" : "default"}
                  variant={s.paymentMethod === opt.value ? "filled" : "outlined"}
                />
              ))}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  if (s.activeHoldSaleId) {
                    s.resetPosForNewSale();
                    return;
                  }
                  s.setLines([]);
                }}
                sx={{ flex: 1, minWidth: 80 }}
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={s.handleHold}
                disabled={s.saleBusy || s.lines.length === 0}
                sx={{ flex: 1, minWidth: 80 }}
              >
                Hold
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<PrintIcon />}
                sx={{ flex: 1, minWidth: 80 }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                onClick={s.handleComplete}
                disabled={s.saleBusy || s.lines.length === 0}
                sx={{
                  flex: 1.5,
                  minWidth: 100,
                  fontWeight: 700,
                  bgcolor: "#0b7a45",
                  "&:hover": { bgcolor: "#09673b" },
                }}
              >
                {s.activeHoldSaleId ? "Complete" : "Pay"}
              </Button>
            </Box>

            <PosHoldOrdersPanel
              activeHoldSaleId={s.activeHoldSaleId}
              onResume={s.resumeHoldOrder}
              itemImageByNumber={s.itemImageByNumber}
              onDeleted={(id) => {
                if (s.activeHoldSaleId === id) {
                  s.resetPosForNewSale();
                }
              }}
            />

            {s.activeHoldSaleId ? (
              <TextField
                fullWidth
                size="small"
                type="password"
                label="Hold PIN"
                value={s.holdPin}
                onChange={(e) => s.setHoldPin(e.target.value)}
                helperText="Required to complete, update, or save this hold order"
              />
            ) : null}
          </Paper>
        </Grid>
      </Grid>

      <CustomerReceivePaymentDialog
        open={receivePaymentOpen}
        customer={selectedCustomer}
        onClose={() => setReceivePaymentOpen(false)}
        onSuccess={(result) => {
          invalidatePosQueries(queryClient);
          enqueueSnackbar(
            `Payment recorded — new balance ${formatDashboardRs(result.new_balance)}`,
            { variant: "success" }
          );
        }}
      />
    </Box>
  );
};

export default PosSaleCheckoutPage;
