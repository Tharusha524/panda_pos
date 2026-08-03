import React, { useMemo } from "react";
import {
  Alert,
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
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { setActiveLocation } from "../../../utils/posActiveLocation";
import CatalogBrowseGrid from "../shared/CatalogBrowseGrid";
import PosCategoryTabs from "../sales/PosCategoryTabs";
import PosSubCategoryTabs from "../sales/PosSubCategoryTabs";
import PurchaseProductCard from "./PurchaseProductCard";
import { usePurchaseSession } from "./purchaseContext";
import { formatPurchaseRs, PURCHASES_BASE } from "./purchaseFormUtils";
import { PURCHASE_TYPE_RETURN } from "./purchaseConstants";

const PurchaseProductSelectPage: React.FC = () => {
  const s = usePurchaseSession();
  const isReturn = s.form.purchase_type === PURCHASE_TYPE_RETURN;

  const returnLineTotals = useMemo(() => {
    if (!isReturn) return null;
    return s.lines.reduce(
      (acc, line) => ({
        purchased: acc.purchased + Number(line.purchased_qty ?? line.qty ?? 0),
        returned: acc.returned + Number(line.returned_qty ?? 0),
        remaining: acc.remaining + Number(line.max_return_qty ?? line.qty ?? 0),
      }),
      { purchased: 0, returned: 0, remaining: 0 }
    );
  }, [isReturn, s.lines]);

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
          to={PURCHASES_BASE}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          Select Products · {s.form.invoice_id || "…"}
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
        ) : (
          <Typography variant="body2" color="text.secondary">
            Branch: {s.itemBranch}
          </Typography>
        )}
      </Box>

      {isReturn && returnLineTotals ? (
        <Alert severity="warning" sx={{ mx: { xs: 0.75, sm: 1 }, mb: 1 }}>
          Purchased: <strong>{returnLineTotals.purchased}</strong>
          {" · "}Already returned: <strong>{returnLineTotals.returned}</strong>
          {" · "}Remaining to return: <strong>{returnLineTotals.remaining}</strong>
        </Alert>
      ) : null}

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
                ? `No items at ${s.itemBranch}. Add items in Inventory for this branch.`
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
                const line = s.lines.find((l) => l.item_id === item.id);
                const inCart = Boolean(line);
                return (
                <PurchaseProductCard
                  key={item.id}
                  item={item}
                  variant="large"
                  inCart={inCart}
                  cartQty={line?.qty ?? 0}
                  onAdd={() => s.addItemToCart(item, s.parsedCatalogSearch.qty ?? 1)}
                  onSetQty={
                    line
                      ? (qty) => s.setLineQty(line.key, qty)
                      : undefined
                  }
                  onQtyDelta={
                    line
                      ? (delta) => s.updateLineQty(line.key, delta)
                      : undefined
                  }
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
            {s.lines.length} product{s.lines.length === 1 ? "" : "s"} in cart
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#c62828", lineHeight: 1.2 }}>
            {formatPurchaseRs(s.computedAmount)}
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

export default PurchaseProductSelectPage;
