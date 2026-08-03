import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  createItem,
  getItem,
  getItemCategories,
  getNextItemNumber,
  updateItem,
  uploadItemImage,
  type DiscountType,
  type ItemPayload,
} from "../../../api/itemsApi";
import { fetchBranches } from "../../../api/Settings/branchApi";
import { getInventorySettings } from "../../../api/Settings/inventorySettingsApi";
import { getItemSettings } from "../../../api/Settings/itemSettingsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { resolveItemImageUrl } from "../../../utils/resolveStorageUrl";
import PageTitle from "../../../components/PageTitle";
import { calcPricing } from "./itemFormCalculations";
import ItemCategoryFormDialog, { type CategorySavedResult } from "./ItemCategoryFormDialog";
import { DEFAULT_ITEM_PRODUCT_TYPE, ITEM_PRODUCT_TYPES } from "./itemProductTypes";
import { DEFAULT_UOM_OPTIONS } from "./uomOptions";

const ITEMS_BASE = "/items";

const pageSx = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
  minHeight: "calc(100vh - 112px)",
  display: "flex",
  flexDirection: "column" as const,
};

const cardSx = {
  width: "100%",
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: "4px",
  boxShadow: "0 0 10px rgba(0,0,0,0.06)",
  mb: 2,
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography sx={sectionTitleSx}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

const sectionTitleSx = {
  fontWeight: 700,
  fontSize: "1rem",
  color: "var(--pallet-blue)",
  mb: 2,
};

const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "var(--surface-bg)" } };

function emptyForm(): ItemPayload {
  return {
    item_number: "",
    auto_generate_item_number: true,
    description: "",
    category: null,
    sub_category: null,
    item_category_id: null,
    item_sub_category_id: null,
    product_type: DEFAULT_ITEM_PRODUCT_TYPE,
    location: "Main Location",
    selling_price: 0,
    wholesale_price: 0,
    purchase_price: 0,
    default_discount: 0,
    default_discount_type: "percent",
    max_discount: 0,
    has_multiple_options: false,
    item_details: "",
    track_with_inventory: true,
    qty: 0,
    reorder_qty: 0,
    uom: "pcs",
    expiry_date: null,
    item_code: "",
    supplier_item_code: "",
    sku: "",
    is_favourite: false,
    is_active: true,
  };
}

const ItemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const itemId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<ItemPayload>(emptyForm);
  const [maxDiscountType, setMaxDiscountType] = useState<DiscountType>("percent");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: itemSettings } = useQuery({
    queryKey: ["item-settings"],
    queryFn: getItemSettings,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["item-categories"],
    queryFn: getItemCategories,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });

  const { data: inventorySettings } = useQuery({
    queryKey: ["inventory-settings"],
    queryFn: getInventorySettings,
  });

  const {
    data: existingItem,
    isLoading: loadingItem,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItem(itemId!),
    enabled: isEdit && itemId != null && !Number.isNaN(itemId),
  });

  const locationOptions = useMemo(() => {
    if (inventorySettings && !inventorySettings.manage_multiple_locations) {
      return ["Main Location"];
    }
    const names = branches.map((b) => b.name).filter(Boolean);
    const set = new Set(["Main Location", ...names]);
    if (form.location) set.add(form.location);
    return Array.from(set);
  }, [branches, form.location, inventorySettings]);

  const selectedCategory = categories.find((c) => c.id === form.item_category_id);
  const subCategories = selectedCategory?.sub_categories ?? [];

  const pricing = useMemo(
    () => calcPricing(Number(form.selling_price) || 0, Number(form.purchase_price) || 0),
    [form.selling_price, form.purchase_price]
  );

  const allowAutoNumber = itemSettings?.allow_auto_number !== false;
  const showWholesale = itemSettings?.allow_wholesale_price !== false;
  const showDiscount = itemSettings?.allow_item_discount !== false;
  const showVariants = itemSettings?.allow_variant_in_add_item !== false;
  const showFavourite = itemSettings?.allow_favorite_items_on_sales_screen !== false;
  const showImage = itemSettings?.allow_upload_item_image === true;
  const uomOptions =
    itemSettings?.uom_options?.length ? itemSettings.uom_options : [...DEFAULT_UOM_OPTIONS];
  const showSku = allowAutoNumber;

  useEffect(() => {
    if (!existingItem) return;
    setForm({
      item_number: existingItem.item_number,
      auto_generate_item_number: existingItem.auto_generate_item_number ?? false,
      description: existingItem.description,
      category: existingItem.category,
      sub_category: existingItem.sub_category,
      item_category_id: existingItem.item_category_id ?? null,
      item_sub_category_id: existingItem.item_sub_category_id ?? null,
      product_type: existingItem.product_type ?? "P",
      location: existingItem.location ?? "Main Location",
      selling_price: existingItem.selling_price,
      wholesale_price: existingItem.wholesale_price ?? 0,
      purchase_price: existingItem.purchase_price ?? 0,
      default_discount: existingItem.default_discount ?? 0,
      default_discount_type: existingItem.default_discount_type ?? "percent",
      max_discount: existingItem.max_discount ?? 0,
      has_multiple_options: existingItem.has_multiple_options ?? false,
      item_details: existingItem.item_details ?? "",
      track_with_inventory: existingItem.track_with_inventory ?? true,
      qty: existingItem.qty ?? 0,
      reorder_qty: existingItem.reorder_qty ?? 0,
      uom: existingItem.uom ?? "pcs",
      expiry_date: existingItem.expiry_date ?? null,
      item_code: existingItem.item_code ?? "",
      supplier_item_code: existingItem.supplier_item_code ?? "",
      sku: existingItem.sku ?? "",
      is_favourite: existingItem.is_favourite ?? false,
      is_active: existingItem.is_active,
    });
    setImagePreview(resolveItemImageUrl(existingItem));
    setImageFile(null);
  }, [existingItem]);

  useEffect(() => {
    if (isEdit || !allowAutoNumber || !form.auto_generate_item_number) return;
    let cancelled = false;
    getNextItemNumber()
      .then((num) => {
        if (!cancelled) {
          setForm((prev) => ({ ...prev, item_number: num }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEdit, form.auto_generate_item_number, allowAutoNumber]);

  useEffect(() => {
    if (itemSettings && !itemSettings.allow_auto_number && !isEdit) {
      setForm((prev) => ({ ...prev, auto_generate_item_number: false }));
    }
  }, [itemSettings, isEdit]);

  const setField = <K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategorySaved = async (result: CategorySavedResult) => {
    await queryClient.refetchQueries({ queryKey: ["item-categories"] });
    const updated =
      queryClient.getQueryData<typeof categories>(["item-categories"]) ?? categories;

    if (result.kind === "category") {
      const cat = updated.find((c) => c.id === result.categoryId);
      setForm((prev) => ({
        ...prev,
        item_category_id: result.categoryId,
        item_sub_category_id: null,
        category: cat?.name ?? prev.category,
        sub_category: null,
        product_type: cat?.product_type ?? prev.product_type,
      }));
    } else {
      const cat = updated.find((c) => c.id === result.categoryId);
      const sub = cat?.sub_categories.find((s) => s.id === result.subCategoryId);
      setForm((prev) => ({
        ...prev,
        item_category_id: result.categoryId,
        item_sub_category_id: result.subCategoryId ?? null,
        category: cat?.name ?? prev.category,
        sub_category: sub?.name ?? prev.sub_category,
        product_type: cat?.product_type ?? prev.product_type,
      }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const useAuto = allowAutoNumber && (form.auto_generate_item_number ?? false);
      const payload: ItemPayload = {
        ...form,
        auto_generate_item_number: useAuto,
        category: selectedCategory?.name ?? form.category,
        sub_category:
          subCategories.find((s) => s.id === form.item_sub_category_id)?.name ?? form.sub_category,
        item_number: useAuto && !form.item_number?.trim() ? "" : form.item_number,
      };
      let saved;
      if (isEdit && itemId) {
        saved = await updateItem(itemId, payload);
      } else {
        saved = await createItem(payload);
      }
      if (imageFile && itemSettings?.allow_upload_item_image) {
        await uploadItemImage(saved.id, imageFile);
      }
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
      enqueueSnackbar(isEdit ? "Item updated" : "Item created", { variant: "success" });
      navigate(ITEMS_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save item"), { variant: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      enqueueSnackbar("Item name (description) is required", { variant: "warning" });
      return;
    }
    const needsManualNumber = !allowAutoNumber || !form.auto_generate_item_number;
    if (needsManualNumber && !form.item_number?.trim()) {
      enqueueSnackbar("Item number is required", { variant: "warning" });
      return;
    }
    saveMutation.mutate();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  if (isEdit && loadingItem) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  if (isEdit && loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{getFriendlyErrorMessage(loadErr, "Failed to load item")}</Alert>
        <Button component={Link} to={ITEMS_BASE} sx={{ mt: 2 }}>
          Back to items
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={pageSx}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "var(--app-bg)",
          pb: 2,
          mb: 1,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <Button
          component={Link}
          to={ITEMS_BASE}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
        >
          Back to Items
        </Button>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <PageTitle
            title={isEdit ? "Edit Item" : "Add Item"}
            subtitle="General information, pricing, stock, and product details"
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} to={ITEMS_BASE} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="item-form"
              variant="contained"
              startIcon={
                saveMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              disabled={saveMutation.isPending}
              sx={{
                bgcolor: "var(--pallet-blue)",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
            >
              {saveMutation.isPending ? "Saving…" : isEdit ? "Update Item" : "Save Item"}
            </Button>
          </Box>
        </Box>
      </Box>

      <form id="item-form" onSubmit={handleSubmit} style={{ flex: 1 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} lg={7}>
            <FormSection title="General Information">
            <Grid container spacing={2}>
              {allowAutoNumber && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.auto_generate_item_number ?? true}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setField("auto_generate_item_number", checked);
                          if (checked && !isEdit) {
                            getNextItemNumber().then((num) => setField("item_number", num));
                          }
                        }}
                      />
                    }
                    label="Auto generate item number"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Item Number"
                  value={form.item_number}
                  onChange={(e) => setField("item_number", e.target.value)}
                  disabled={form.auto_generate_item_number && allowAutoNumber}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={showSku ? 6 : 8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Item Name (Description)"
                  required
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  sx={fieldSx}
                />
              </Grid>
              {showSku && (
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="SKU"
                    value={form.sku ?? ""}
                    onChange={(e) => setField("sku", e.target.value)}
                    helperText="Internal product code"
                    sx={fieldSx}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              {showImage && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Item Image
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {imagePreview && (
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Item"
                        sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }}
                      />
                    )}
                    <Button variant="outlined" component="label" size="small" sx={{ textTransform: "none" }}>
                      Upload image
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                      />
                    </Button>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: "1px solid var(--surface-border)",
                    borderRadius: 1,
                    p: 2,
                    bgcolor: "var(--surface-bg-alt)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Category &amp; product type
                    </Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setCategoryDialogOpen(true)}
                      sx={{
                        textTransform: "none",
                        borderColor: "var(--surface-border)",
                        bgcolor: "var(--surface-bg)",
                      }}
                    >
                      Add category
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small" sx={fieldSx}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          label="Category"
                          value={form.item_category_id ?? ""}
                          onChange={(e) => {
                            const catId = e.target.value === "" ? null : Number(e.target.value);
                            const cat = categories.find((c) => c.id === catId);
                            setForm((prev) => ({
                              ...prev,
                              item_category_id: catId,
                              item_sub_category_id: null,
                              category: cat?.name ?? null,
                              sub_category: null,
                              product_type: cat?.product_type ?? prev.product_type,
                            }));
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={fieldSx}
                        disabled={!form.item_category_id}
                      >
                        <InputLabel>Sub Category</InputLabel>
                        <Select
                          label="Sub Category"
                          value={form.item_sub_category_id ?? ""}
                          onChange={(e) => {
                            const subId = e.target.value === "" ? null : Number(e.target.value);
                            setField("item_sub_category_id", subId);
                            setField(
                              "sub_category",
                              subCategories.find((s) => s.id === subId)?.name ?? null
                            );
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {subCategories.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small" sx={fieldSx}>
                        <InputLabel>Product Type</InputLabel>
                        <Select
                          label="Product Type"
                          value={form.product_type ?? DEFAULT_ITEM_PRODUCT_TYPE}
                          onChange={(e) => setField("product_type", e.target.value)}
                        >
                          {ITEM_PRODUCT_TYPES.map((pt) => (
                            <MenuItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            </FormSection>

            <FormSection title="Pricing">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Selling Price"
                  type="number"
                  value={form.selling_price}
                  onChange={(e) => setField("selling_price", parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                />
              </Grid>
              {showWholesale && (
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Whole sales Price"
                    type="number"
                    value={form.wholesale_price}
                    onChange={(e) => setField("wholesale_price", parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: "0.01" }}
                    sx={fieldSx}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Purchase Price"
                  type="number"
                  value={form.purchase_price}
                  onChange={(e) => setField("purchase_price", parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                />
              </Grid>
              {showDiscount && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                      Default Discount
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        size="small"
                        type="number"
                        value={form.default_discount}
                        onChange={(e) =>
                          setField("default_discount", parseFloat(e.target.value) || 0)
                        }
                        sx={{ flex: 1, ...fieldSx }}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                      <RadioGroup
                        row
                        value={form.default_discount_type ?? "percent"}
                        onChange={(e) =>
                          setField("default_discount_type", e.target.value as DiscountType)
                        }
                      >
                        <FormControlLabel value="percent" control={<Radio size="small" />} label="%" />
                        <FormControlLabel value="amount" control={<Radio size="small" />} label="Rs" />
                      </RadioGroup>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                      Max Discount
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        size="small"
                        type="number"
                        value={form.max_discount}
                        onChange={(e) => setField("max_discount", parseFloat(e.target.value) || 0)}
                        sx={{ flex: 1, ...fieldSx }}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                      <RadioGroup
                        row
                        value={maxDiscountType}
                        onChange={(e) => setMaxDiscountType(e.target.value as DiscountType)}
                      >
                        <FormControlLabel value="percent" control={<Radio size="small" />} label="%" />
                        <FormControlLabel value="amount" control={<Radio size="small" />} label="Rs" />
                      </RadioGroup>
                    </Box>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    p: 2,
                    bgcolor: "var(--surface-bg-alt)",
                    borderRadius: 1,
                    border: "1px solid #e8eef4",
                  }}
                >
                  <Typography variant="body2">
                    <strong>Margin:</strong> {pricing.margin}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Markup:</strong> {pricing.markup}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Profit:</strong> Rs {pricing.profit.toLocaleString("en-LK")}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            </FormSection>

            <FormSection title="Options">
            {showVariants && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.has_multiple_options ?? false}
                    onChange={(e) => setField("has_multiple_options", e.target.checked)}
                  />
                }
                label="This item has multiple options, like different sizes or colors"
                sx={{ mb: 2, display: "block" }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Item Details
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              placeholder="Additional details about this item…"
              value={form.item_details ?? ""}
              onChange={(e) => setField("item_details", e.target.value)}
              sx={fieldSx}
            />
            </FormSection>
          </Grid>

          <Grid item xs={12} lg={5}>
            <FormSection title="Stock Count">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.track_with_inventory ?? true}
                      onChange={(e) => setField("track_with_inventory", e.target.checked)}
                    />
                  }
                  label="Track with inventory"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Quantity"
                  type="number"
                  value={form.qty}
                  onChange={(e) => setField("qty", parseFloat(e.target.value) || 0)}
                  disabled={!form.track_with_inventory}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reorder Quantity"
                  type="number"
                  value={form.reorder_qty}
                  onChange={(e) => setField("reorder_qty", parseFloat(e.target.value) || 0)}
                  disabled={!form.track_with_inventory}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
            </FormSection>

            <FormSection title="Stock Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Unit of Measure</InputLabel>
                  <Select
                    label="Unit of Measure"
                    value={form.uom ?? "pcs"}
                    onChange={(e) => setField("uom", e.target.value)}
                  >
                    {uomOptions.map((u) => (
                      <MenuItem key={u} value={u}>
                        {u}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  How this item is counted in stock and sold. Manage unit types in{" "}
                  <Link to={`${ITEMS_BASE}/settings`} style={{ color: "var(--pallet-blue)" }}>
                    Item Settings → Units of measure
                  </Link>
                  .
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Inventory Location</InputLabel>
                  <Select
                    label="Inventory Location"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                  >
                    {locationOptions.map((loc) => (
                      <MenuItem key={loc} value={loc}>
                        {loc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Expiry Date"
                  type="date"
                  value={form.expiry_date ?? ""}
                  onChange={(e) => setField("expiry_date", e.target.value || null)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
            </FormSection>

            <FormSection title="Others">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Item code"
                  value={form.item_code ?? ""}
                  onChange={(e) => setField("item_code", e.target.value)}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Supplier Item code"
                  value={form.supplier_item_code ?? ""}
                  onChange={(e) => setField("supplier_item_code", e.target.value)}
                  sx={fieldSx}
                />
              </Grid>
              {!showSku && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="SKU"
                    value={form.sku ?? ""}
                    onChange={(e) => setField("sku", e.target.value)}
                    sx={fieldSx}
                  />
                </Grid>
              )}
              {showFavourite && (
                <Grid item xs={12}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={
                      form.is_favourite ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )
                    }
                    onClick={() => setField("is_favourite", !form.is_favourite)}
                    sx={{ textTransform: "none", borderColor: "var(--surface-border)" }}
                  >
                    {form.is_favourite ? "Favourite Item" : "Add to Wishlist / Favourite"}
                  </Button>
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
            </FormSection>
          </Grid>
        </Grid>

        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            mt: 2,
            py: 2,
            px: 2,
            bgcolor: "var(--surface-bg)",
            borderTop: "1px solid var(--surface-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            flexWrap: "wrap",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Button component={Link} to={ITEMS_BASE} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              saveMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            disabled={saveMutation.isPending}
            sx={{
              bgcolor: "var(--pallet-blue)",
              textTransform: "none",
              fontWeight: 600,
              minWidth: 140,
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Update Item" : "Save Item"}
          </Button>
        </Box>
      </form>

      <ItemCategoryFormDialog
        open={categoryDialogOpen}
        categories={categories}
        parentCategoryId={form.item_category_id}
        defaultKind={form.item_category_id ? "subcategory" : "category"}
        onClose={() => setCategoryDialogOpen(false)}
        onSaved={handleCategorySaved}
      />
    </Box>
  );
};

export default ItemFormPage;
