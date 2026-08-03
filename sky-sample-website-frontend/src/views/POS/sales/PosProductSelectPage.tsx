import React from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Link } from "react-router";
import CatalogBrowseGrid from "../shared/CatalogBrowseGrid";
import PosCategoryTabs from "./PosCategoryTabs";
import PosSubCategoryTabs from "./PosSubCategoryTabs";
import PosProductCard from "./PosProductCard";
import PosSalesTypeToggle from "./PosSalesTypeToggle";
import { usePosSale } from "./posSaleContext";
import { getProductOfferForItem } from "./posProductOffers";
import { formatSaleRs, SALES_BASE } from "./saleFormUtils";

const PosProductSelectPage: React.FC = () => {
  const s = usePosSale();

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "var(--surface-bg-alt)", pb: 10 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          p: { xs: 0.75, sm: 1 },
          pb: 0.5,
        }}
      >
        <Button
          component={Link}
          to={SALES_BASE}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          Select Products · {s.form.sales_id || "…"}
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
        {s.allowPriceSwitch ? (
          <PosSalesTypeToggle
            value={s.salesPriceMode}
            onChange={s.handleSalesPriceModeChange}
            allowWholesale={s.allowWholesalePrice}
            compact
          />
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {s.catalogScopeLabel} · {s.itemBranch}
          {s.salesPriceMode === "Wholesale"
            ? " · Wholesale prices"
            : s.allowWholesalePrice
              ? " · Retail prices"
              : ""}
        </Typography>
      </Box>

      <Paper
        sx={{
          mx: { xs: 0.75, sm: 1 },
          p: 1.25,
          borderRadius: 1.5,
          minHeight: "calc(100vh - 160px)",
          height: "calc(100vh - 160px)",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #cfd8e3",
          bgcolor: "var(--surface-bg)",
        }}
      >
        {s.loadingCategories ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} sx={{ color: "var(--pallet-blue)" }} />
          </Box>
        ) : (
          <>
            <PosCategoryTabs
              categories={s.categories}
              activeTab={s.categoryTab}
              onChange={s.handleCategoryTabChange}
            />
            {s.visibleSubCategories.length > 0 ? (
              <PosSubCategoryTabs
                subCategories={s.visibleSubCategories}
                parentLabel={
                  typeof s.categoryTab === "number" ? s.activeCategoryName : undefined
                }
                activeSubTab={s.subCategoryTab}
                onChange={s.setSubCategoryTab}
              />
            ) : null}
          </>
        )}

        <Box sx={{ flex: 1, minHeight: 0, mt: 0.75, display: "flex", flexDirection: "column" }}>
          <CatalogBrowseGrid
            search={s.catalogSearch}
            onSearchChange={s.setCatalogSearch}
            onSearchSubmit={s.handleCatalogSearchSubmit}
            searchPlaceholder={`Search in ${s.categoryTabLabel}… (e.g. ITEM001*0.5)`}
            searchHelperText="Item code × qty — press Enter to add (0.5 kg, 250 g)"
            minTileWidth={220}
            gridGap={2}
            maxHeight="fill"
            isEmpty={!s.loadingItems && s.filteredItems.length === 0}
            emptyMessage={
              s.catalogItems.length === 0
                ? "No inventory items across branches. Add stock in Inventory."
                : s.categoryTab === "favourite"
                  ? "No favourite items. Mark items as favourite in Inventory."
                  : s.subCategoryTab !== "all"
                    ? "No items in this sub category."
                    : "No items in this category."
            }
          >
            {s.loadingItems ? (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
              </Box>
            ) : (
              s.filteredItems.map((item) => {
                const productOffer = getProductOfferForItem(
                  item.item_number,
                  s.productOfferMap
                );
                const offerLabel = productOffer
                  ? productOffer.discount_summary ??
                    (productOffer.product_percent_off
                      ? `${productOffer.product_percent_off}% OFF`
                      : productOffer.name)
                  : null;
                return (
                  <PosProductCard
                    key={item.id}
                    item={item}
                    salesType={s.salesPriceMode}
                    showBothPrices={false}
                    variant="large"
                    cartQty={s.cartQtyForItem(item.id)}
                    hasBatches={item.has_batches === true}
                    offerLabel={offerLabel}
                    onAddMain={() => s.addMainItemToCart(item, s.parsedCatalogSearch.qty ?? 1)}
                    onOpenBatches={() => s.openBatchPicker(item, s.parsedCatalogSearch.qty ?? 1)}
                    onRemove={() => s.removeFromCart(item)}
                  />
                );
              })
            )}
          </CatalogBrowseGrid>
        </Box>
      </Paper>

      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderTop: "1px solid #cfd8e3",
          bgcolor: "var(--surface-bg)",
        }}
      >
        <Badge badgeContent={s.lines.length} color="primary" max={99}>
          <ShoppingCartIcon color="action" />
        </Badge>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {s.lines.length} item{s.lines.length === 1 ? "" : "s"} in cart
            {s.form.offer_id && s.selectedOffer
              ? ` · ${s.selectedOffer.name}${s.offerUpdating ? " (updating…)" : ""}`
              : ""}
          </Typography>
          {s.offerDiscount > 0 ? (
            <Typography variant="caption" sx={{ color: "success.main", display: "block" }}>
              Offer −{s.offerDiscount.toFixed(2)}
            </Typography>
          ) : null}
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#c62828", lineHeight: 1.2 }}>
            {formatSaleRs(s.netAmount)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={s.goToCheckout}
          disabled={s.lines.length === 0}
          sx={{
            minWidth: 160,
            fontWeight: 700,
            bgcolor: "#1565c0",
            "&:hover": { bgcolor: "#0d47a1" },
          }}
        >
          Checkout
        </Button>
      </Paper>
    </Box>
  );
};

export default PosProductSelectPage;
