import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getItemCategories, getItems, type Item, type ItemCategory } from "../../../api/itemsApi";
import { boxTileSelectedSx, boxTileSx } from "../sales/posSaleConstants";
import CatalogBrowseGrid, { filterCatalogSearch } from "../shared/CatalogBrowseGrid";
import { formatPurchasePricePerUom } from "./purchaseFormUtils";
import { formatStockQty } from "../sales/posSaleUom";

type CatalogStep = "main" | "sub" | "items";

interface PurchaseCatalogPickerProps {
  branchLocation: string;
  linesItemIds: Set<number>;
  onAddItem: (item: Item, qty?: number) => void;
  fullPage?: boolean;
  defaultAddQty?: number | null;
}

const PurchaseCatalogPicker: React.FC<PurchaseCatalogPickerProps> = ({
  branchLocation,
  linesItemIds,
  onAddItem,
  fullPage = false,
  defaultAddQty = null,
}) => {
  const [catalogStep, setCatalogStep] = useState<CatalogStep>("main");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");

  useEffect(() => {
    setCatalogStep("main");
    setSelectedCategory(null);
    setSelectedSubId(null);
    setCatalogSearch("");
  }, [branchLocation]);

  useEffect(() => {
    setCatalogSearch("");
  }, [catalogStep, selectedCategory?.id]);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["item-categories"],
    queryFn: getItemCategories,
  });

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["items", "purchase-catalog", branchLocation],
    queryFn: () => getItems(undefined, branchLocation),
    enabled: Boolean(branchLocation) && branchLocation !== "all",
  });

  const catalogItems = useMemo(
    () => (itemsData?.items ?? []).filter((i) => i.is_active),
    [itemsData?.items]
  );

  const filteredItems = useMemo(() => {
    if (catalogStep !== "items") return [];
    let list = catalogItems;
    if (selectedSubId != null) {
      list = list.filter((i) => i.item_sub_category_id === selectedSubId);
    } else if (selectedCategory) {
      list = list.filter(
        (i) =>
          i.item_category_id === selectedCategory.id ||
          (i.category === selectedCategory.name && !i.item_sub_category_id)
      );
    }
    if (catalogSearch.trim()) {
      list = list.filter((i) =>
        filterCatalogSearch(
          catalogSearch,
          i.item_number,
          i.description,
          i.category,
          i.sub_category,
          i.sku,
          i.item_code
        )
      );
    }
    return list;
  }, [catalogStep, catalogItems, selectedCategory, selectedSubId, catalogSearch]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) =>
        filterCatalogSearch(catalogSearch, cat.name, cat.product_type)
      ),
    [categories, catalogSearch]
  );

  const filteredSubCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.sub_categories.filter((sub) =>
      filterCatalogSearch(catalogSearch, sub.name, selectedCategory.name)
    );
  }, [selectedCategory, catalogSearch]);

  const breadcrumb =
    catalogStep === "main"
      ? "Main categories"
      : catalogStep === "sub" && selectedCategory
        ? selectedCategory.name
        : selectedCategory
          ? `${selectedCategory.name} › Items`
          : "Items";

  const loading = loadingCategories || loadingItems;

  const shellSx = fullPage
    ? {
        p: 1.25,
        borderRadius: 1.5,
        minHeight: "calc(100vh - 160px)",
        height: "calc(100vh - 160px)",
        display: "flex",
        flexDirection: "column" as const,
        border: "1px solid #cfd8e3",
        bgcolor: "var(--surface-bg)",
      }
    : { p: 2, borderRadius: 2, minHeight: 400 };

  const itemGridProps = fullPage
    ? { minTileWidth: 220, gridGap: 2, maxHeight: "fill" as const }
    : { minTileWidth: 150, maxHeight: 480 as number };

  return (
    <Paper sx={shellSx} elevation={fullPage ? 0 : 1}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        {catalogStep !== "main" && (
          <Button
            size="small"
            onClick={() => {
              if (catalogStep === "items") {
                setCatalogStep(selectedCategory?.sub_categories?.length ? "sub" : "main");
                setSelectedSubId(null);
              } else {
                setCatalogStep("main");
                setSelectedCategory(null);
              }
            }}
            sx={{ textTransform: "none" }}
          >
            ← Back
          </Button>
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {breadcrumb}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
        </Box>
      ) : catalogStep === "main" ? (
        <CatalogBrowseGrid
          search={catalogSearch}
          onSearchChange={setCatalogSearch}
          searchPlaceholder="Search main categories…"
          isEmpty={
            !filterCatalogSearch(catalogSearch, "all items") &&
            filteredCategories.length === 0
          }
          emptyMessage="No categories match your search."
        >
          {filterCatalogSearch(catalogSearch, "all items", "products") && (
            <Box
              sx={boxTileSx}
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubId(null);
                setCatalogStep("items");
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                All items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {catalogItems.length} products
              </Typography>
            </Box>
          )}
          {filteredCategories.map((cat) => (
            <Box
              key={cat.id}
              sx={boxTileSx}
              onClick={() => {
                setSelectedCategory(cat);
                setCatalogStep(cat.sub_categories?.length ? "sub" : "items");
                setSelectedSubId(null);
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {cat.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cat.sub_categories?.length ? `${cat.sub_categories.length} sub` : "View items"}
              </Typography>
            </Box>
          ))}
        </CatalogBrowseGrid>
      ) : catalogStep === "sub" && selectedCategory ? (
        <CatalogBrowseGrid
          search={catalogSearch}
          onSearchChange={setCatalogSearch}
          searchPlaceholder={`Search in ${selectedCategory.name}…`}
          isEmpty={
            !filterCatalogSearch(catalogSearch, "all", selectedCategory.name) &&
            filteredSubCategories.length === 0
          }
          emptyMessage="No sub categories match your search."
        >
          {filterCatalogSearch(catalogSearch, "all", selectedCategory.name) && (
            <Box
              sx={boxTileSx}
              onClick={() => {
                setSelectedSubId(null);
                setCatalogStep("items");
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                All in {selectedCategory.name}
              </Typography>
            </Box>
          )}
          {filteredSubCategories.map((sub) => (
            <Box
              key={sub.id}
              sx={boxTileSx}
              onClick={() => {
                setSelectedSubId(sub.id);
                setCatalogStep("items");
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {sub.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sub category
              </Typography>
            </Box>
          ))}
        </CatalogBrowseGrid>
      ) : (
        <Box sx={fullPage ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : undefined}>
        <CatalogBrowseGrid
          search={catalogSearch}
          onSearchChange={setCatalogSearch}
          searchPlaceholder="Search items by name, item #, SKU… (e.g. ITEM001*0.5)"
          searchHelperText={fullPage ? "Item code × qty — press Enter when viewing items" : undefined}
          minTileWidth={itemGridProps.minTileWidth}
          gridGap={itemGridProps.gridGap}
          maxHeight={itemGridProps.maxHeight}
          isEmpty={filteredItems.length === 0}
          emptyMessage={
            catalogItems.length === 0
              ? `No items at ${branchLocation}. Add items in Inventory for this branch.`
              : "No items match your search."
          }
        >
          {filteredItems.map((item) => {
              const inCart = linesItemIds.has(item.id);
              const unitPrice = item.purchase_price ?? item.last_purchase_price ?? 0;
              const stockQty = Number(item.qty ?? 0);
              const addQty = defaultAddQty ?? 1;
              return (
                <Box
                  key={item.id}
                  sx={{
                    ...(inCart ? boxTileSelectedSx : boxTileSx),
                    minHeight: fullPage ? 220 : undefined,
                    p: fullPage ? 1.25 : undefined,
                  }}
                  onClick={() => onAddItem(item, addQty)}
                >
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ width: "100%" }}>
                    {item.item_number}
                  </Typography>
                  <Typography
                    variant={fullPage ? "body1" : "body2"}
                    sx={{ fontWeight: 600, lineHeight: 1.2, mt: 0.5 }}
                  >
                    {item.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Stock: {formatStockQty(stockQty, item.uom)}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "var(--pallet-blue)", mt: 0.5 }}
                  >
                    {formatPurchasePricePerUom(unitPrice, item.uom)}
                  </Typography>
                </Box>
              );
            })}
        </CatalogBrowseGrid>
        </Box>
      )}
    </Paper>
  );
};

export default PurchaseCatalogPicker;
