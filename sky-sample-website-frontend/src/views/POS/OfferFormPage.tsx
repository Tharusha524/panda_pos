import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { useSnackbar } from "notistack";
import PageTitle from "../../components/PageTitle";
import {
  createOffer,
  getOffer,
  updateOffer,
  type DiscountRules,
  type OfferPayload,
  type OfferSelectedBatch,
} from "../../api/offersApi";
import { getFriendlyErrorMessage } from "../../utils/getFriendlyErrorMessage";
import {
  EMPTY_OFFER_FORM,
  isOrderDiscountType,
  mergeDiscountRules,
  orderTypeDiscountRules,
  WEEK_DAYS,
} from "./offers/offerDefaults";
import { buildOfferSavePayload, offerFormFromApi } from "./offers/offerPayload";
import {
  DiscountTypeSelect,
  OfferPricingModeSelect,
  OfferSection,
  OfferToggleBar,
} from "./offers/OfferFormComponents";
import OfferProductRules from "./offers/OfferProductRules";
import OfferOrderRules from "./offers/OfferOrderRules";
import OfferProductsSelectModal from "./offers/OfferProductsSelectModal";
import OfferSelectedProductsSummary from "./offers/OfferSelectedProductsSummary";
import OfferSelectedBatchesSummary from "./offers/OfferSelectedBatchesSummary";
import { getItems } from "../../api/itemsApi";

type ProductRuleKey =
  | "buy_x_percent_off_all"
  | "set_percent_selected"
  | "bargain_bin"
  | "buy_x_fixed_off"
  | "buy_x_amount_off_each";

const OfferFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const offerId = isNew ? null : Number(id);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<OfferPayload>(EMPTY_OFFER_FORM);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [productsModalExpandAll, setProductsModalExpandAll] = useState(false);
  const [batchDetails, setBatchDetails] = useState<OfferSelectedBatch[]>([]);
  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    target: ProductRuleKey | null;
  }>({ open: false, target: null });
  const [productSearch, setProductSearch] = useState("");
  const [rulePickerDraftId, setRulePickerDraftId] = useState<number | null>(null);

  const { data: offerData, isLoading } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => getOffer(offerId!),
    enabled: offerId !== null && !Number.isNaN(offerId),
  });

  useEffect(() => {
    if (isNew) {
      setForm({ ...EMPTY_OFFER_FORM, discount_rules: mergeDiscountRules(undefined) });
      setBatchDetails([]);
      return;
    }
    if (offerData) {
      setForm(offerFormFromApi(offerData));
      setBatchDetails(offerData.selected_batches ?? []);
    }
  }, [isNew, offerData]);

  const saveMutation = useMutation({
    mutationFn: async (draft: OfferPayload) => {
      const payload = buildOfferSavePayload(draft, catalogItems);
      if (isNew) {
        return createOffer(payload);
      }
      return updateOffer(offerId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers-applicable"] });
      queryClient.invalidateQueries({ queryKey: ["sales-pos-context"] });
      enqueueSnackbar("Offer saved successfully", { variant: "success" });
      navigate("/offers");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : getFriendlyErrorMessage(err, "Failed to save offer");
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const updateRules = <K extends keyof DiscountRules>(
    key: K,
    patch: Partial<NonNullable<DiscountRules[K]>>
  ) => {
    setForm((prev) => ({
      ...prev,
      discount_rules: {
        ...prev.discount_rules,
        [key]: { ...(prev.discount_rules[key] as object), ...patch },
      },
    }));
  };

  const handleClear = () => {
    setForm({ ...EMPTY_OFFER_FORM, discount_rules: mergeDiscountRules(undefined) });
    setBatchDetails([]);
  };

  const openProductPicker = (target: ProductRuleKey) => {
    setProductSearch("");
    setRulePickerDraftId(null);
    setProductDialog({ open: true, target });
  };

  const { data: catalogData } = useQuery({
    queryKey: ["offer-products-catalog"],
    queryFn: () => getItems(),
  });
  const catalogItems = catalogData?.items ?? [];

  const { data: ruleCatalogData } = useQuery({
    queryKey: ["offer-product-picker"],
    queryFn: () => getItems(),
    enabled: productDialog.open,
  });
  const ruleCatalogItems = ruleCatalogData?.items ?? catalogItems;

  const filteredCatalog = ruleCatalogItems.filter((item) => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return true;
    const hay = [
      item.item_number,
      item.description,
      item.category,
      item.sub_category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });

  const applyProduct = (itemId: number, name: string) => {
    if (!productDialog.target) return;
    updateRules(productDialog.target, {
      product_id: itemId,
      product_name: name,
    });
    setForm((prev) => {
      const ids = new Set(prev.item_ids ?? []);
      ids.add(itemId);
      const match = catalogItems.find((i) => i.id === itemId);
      if (match?.item_number) {
        for (const item of catalogItems) {
          if (item.item_number === match.item_number) {
            ids.add(item.id);
          }
        }
      }
      return { ...prev, item_ids: [...ids] };
    });
    setProductDialog({ open: false, target: null });
  };

  const isOrderType = isOrderDiscountType(form.discount_type);
  const rules = form.discount_rules;

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Button
        component={Link}
        to="/offers"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to offers
      </Button>

      <PageTitle
        title={isNew ? "Create Offer" : "Edit Offer"}
        subtitle="Configure offer details and discount rules"
      />

      <Card
        elevation={0}
        sx={{
          width: "100%",
          bgcolor: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "4px",
          boxShadow: "0 0 10px rgba(0,0,0,0.06)",
          mt: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {isLoading && !isNew ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
            </Box>
          ) : (
            <>
              <OfferSection title="Basic Information" showAttach>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    required
                    placeholder="Name"
                    label="Offer name"
                    value={form.name ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    placeholder="Description"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    size="small"
                  />
                </Stack>
              </OfferSection>

              <OfferToggleBar
                label="Days of the week"
                checked={form.days_of_week_enabled}
                onChange={(checked) =>
                  setForm((p) => ({ ...p, days_of_week_enabled: checked }))
                }
              >
                <FormGroup row sx={{ flexWrap: "wrap" }}>
                  {WEEK_DAYS.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          size="small"
                          checked={form.days_of_week.includes(day)}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              days_of_week: e.target.checked
                                ? [...p.days_of_week, day]
                                : p.days_of_week.filter((d) => d !== day),
                            }));
                          }}
                        />
                      }
                      label={day.slice(0, 3)}
                    />
                  ))}
                </FormGroup>
              </OfferToggleBar>

              <OfferToggleBar
                label="Expiration date"
                checked={form.expiration_enabled}
                onChange={(checked) =>
                  setForm((p) => ({ ...p, expiration_enabled: checked }))
                }
              >
                <TextField
                  type="date"
                  size="small"
                  label="Expiration date"
                  value={form.expiration_date ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      expiration_date: e.target.value || null,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 280 }}
                />
              </OfferToggleBar>

              <OfferSection title="Discount Type">
                <DiscountTypeSelect
                  value={form.discount_type}
                  onChange={(discount_type) =>
                    setForm((p) => ({
                      ...p,
                      discount_type,
                      discount_rules: isOrderDiscountType(discount_type)
                        ? orderTypeDiscountRules()
                        : mergeDiscountRules(p.discount_rules),
                      item_ids: isOrderDiscountType(discount_type) ? [] : p.item_ids,
                      item_batch_ids: isOrderDiscountType(discount_type) ? [] : p.item_batch_ids,
                    }))
                  }
                />

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                  Apply offer on
                </Typography>
                <OfferPricingModeSelect
                  value={form.pricing_mode ?? "both"}
                  onChange={(pricing_mode) => setForm((p) => ({ ...p, pricing_mode: pricing_mode as OfferPayload["pricing_mode"] }))}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Retail only offers apply when the sale uses retail prices. Wholesale only offers
                  apply when the sale uses wholesale prices.
                </Typography>

                {isOrderType ? (
                  <OfferOrderRules rules={rules} onUpdate={updateRules} />
                ) : (
                  <>
                    <OfferProductRules
                      rules={rules}
                      onUpdate={updateRules}
                      onSelectProduct={openProductPicker}
                    />
                    <OfferSection title="Products & batches">
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ flex: "1 1 240px" }}>
                          Choose products for this offer. Optionally limit it to specific stock
                          batches (e.g. near-expiry clearance).
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={<Inventory2OutlinedIcon />}
                            onClick={() => {
                              setProductsModalExpandAll(false);
                              setProductsModalOpen(true);
                            }}
                            sx={{
                              bgcolor: "var(--pallet-blue)",
                              textTransform: "none",
                              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
                            }}
                          >
                            Select products & batches
                            {(form.item_ids?.length ?? 0) > 0
                              ? ` (${form.item_ids?.length})`
                              : ""}
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Products
                      </Typography>
                      <OfferSelectedProductsSummary
                        selectedIds={form.item_ids ?? []}
                        allItems={catalogItems}
                        selectedBatchIds={form.item_batch_ids ?? []}
                        batchDetails={batchDetails}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                        Batches (optional)
                      </Typography>
                      <OfferSelectedBatchesSummary
                        selectedBatchIds={form.item_batch_ids ?? []}
                        batches={batchDetails}
                      />
                    </OfferSection>
                  </>
                )}
              </OfferSection>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1.5,
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid #eee",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  sx={{
                    color: "text.secondary",
                    borderColor: "var(--surface-border)",
                    minWidth: 100,
                    textTransform: "uppercase",
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={saveMutation.isPending}
                  sx={{
                    bgcolor: "var(--pallet-blue)",
                    minWidth: 100,
                    textTransform: "none",
                    "&:hover": { bgcolor: "var(--pallet-main-blue)" },
                  }}
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <OfferProductsSelectModal
        open={productsModalOpen}
        onClose={() => setProductsModalOpen(false)}
        selectedIds={form.item_ids ?? []}
        selectedBatchIds={form.item_batch_ids ?? []}
        expandAll={productsModalExpandAll}
        onConfirm={({ item_ids, item_batch_ids, batches }) => {
          setForm((p) => ({ ...p, item_ids, item_batch_ids }));
          setBatchDetails(batches);
        }}
        title="Select products & batches"
      />

      <Dialog
        open={productDialog.open}
        onClose={() => setProductDialog({ open: false, target: null })}
        maxWidth="md"
        fullWidth
        scroll="paper"
        sx={{
          "& .MuiDialog-paper": {
            maxWidth: { xs: "96vw", sm: 720, md: 900 },
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
          Select product for rule
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by item #, description, category…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            size="small"
            autoFocus
            sx={{ mb: 2, maxWidth: 400 }}
          />
          <TableContainer sx={{ maxHeight: 400, border: "1px solid var(--surface-border)", borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: "var(--surface-bg-alt)" }} />
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Item #</TableCell>
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                    Price
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCatalog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCatalog.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      selected={rulePickerDraftId === item.id}
                      onClick={() => setRulePickerDraftId(item.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={rulePickerDraftId === item.id}
                          onChange={() =>
                            setRulePickerDraftId((prev) => (prev === item.id ? null : item.id))
                          }
                        />
                      </TableCell>
                      <TableCell>{item.item_number}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {[item.category, item.sub_category].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell align="right">
                        {Number(item.selling_price ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProductDialog({ open: false, target: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={rulePickerDraftId == null}
            onClick={() => {
              const item = filteredCatalog.find((i) => i.id === rulePickerDraftId)
                ?? ruleCatalogItems.find((i) => i.id === rulePickerDraftId);
              if (item) {
                applyProduct(item.id, item.description || item.item_number);
              }
            }}
            sx={{
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Select product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfferFormPage;
