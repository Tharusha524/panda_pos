import React from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import LayersIcon from "@mui/icons-material/Layers";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import type { Item } from "../../../api/itemsApi";
import { resolveItemImageUrl } from "../../../utils/resolveStorageUrl";
import {
  boxTileOutOfStockSx,
  boxTileSelectedSx,
  boxTileSx,
} from "./posSaleConstants";
import { getItemStockQty, isItemOutOfStock } from "./posSaleInventory";
import { ItemExpiryChip } from "../inventory/ItemExpiryChip";
import { isItemExpired } from "../inventory/itemInventoryUtils";
import { getPosItemUnitPrice, type PosSalesPriceMode } from "./posSalePricing";
import { formatPricePerUom, formatStockQty } from "./posSaleUom";

interface PosProductCardProps {
  item: Item;
  salesType: PosSalesPriceMode;
  showBothPrices?: boolean;
  cartQty?: number;
  hasBatches?: boolean;
  offerLabel?: string | null;
  variant?: "default" | "large";
  onAddMain: () => void;
  onOpenBatches?: () => void;
  onRemove: () => void;
}

const cardBaseSx = {
  ...boxTileSx,
  minHeight: 168,
  p: 1,
  alignItems: "stretch",
  textAlign: "left" as const,
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: 1.5,
  position: "relative" as const,
  overflow: "hidden",
  "&:hover": {
    borderColor: "#5a9fc9",
    boxShadow: "0 2px 8px rgba(0,80,140,0.12)",
  },
};

const priceLineSx = (active: boolean, large: boolean) => ({
  fontWeight: 700,
  fontSize: large ? "0.85rem" : "0.72rem",
  textAlign: "center" as const,
  color: active ? "#c62828" : "#666",
});

const PosProductCard: React.FC<PosProductCardProps> = ({
  item,
  salesType,
  showBothPrices = false,
  cartQty = 0,
  hasBatches = false,
  offerLabel,
  variant = "default",
  onAddMain,
  onOpenBatches,
  onRemove,
}) => {
  const isLarge = variant === "large";
  const expired = isItemExpired(item);
  const outOfStock = isItemOutOfStock(item);
  const blocked = outOfStock || expired;
  const inCart = cartQty > 0;
  const stockQty = getItemStockQty(item);
  const retailPrice = item.selling_price ?? 0;
  const wholesalePrice = item.wholesale_price ?? 0;
  const activePrice = getPosItemUnitPrice(item, salesType);
  const imageUrl = resolveItemImageUrl(item);
  const tileSx = blocked
    ? {
        ...cardBaseSx,
        minHeight: isLarge ? 280 : 168,
        p: isLarge ? 1.25 : 1,
        ...boxTileOutOfStockSx,
        bgcolor: expired ? "#ffebee" : "#f5f5f5",
      }
    : inCart
      ? {
          ...cardBaseSx,
          minHeight: isLarge ? 280 : 168,
          p: isLarge ? 1.25 : 1,
          ...boxTileSelectedSx,
          borderColor: "#1565c0",
          bgcolor: "var(--tint-info-bg)",
        }
      : {
          ...cardBaseSx,
          minHeight: isLarge ? 280 : 168,
          p: isLarge ? 1.25 : 1,
        };

  const handleCardClick = () => {
    if (blocked) return;
    onAddMain();
  };

  return (
    <Box
      sx={{
        ...tileSx,
        cursor: blocked ? "default" : "pointer",
      }}
      onClick={handleCardClick}
    >
      {offerLabel ? (
        <Chip
          icon={<LocalOfferIcon sx={{ fontSize: "14px !important" }} />}
          label={offerLabel}
          size="small"
          color="warning"
          sx={{
            position: "absolute",
            top: 6,
            left: 6,
            zIndex: 1,
            height: 22,
            fontSize: "0.62rem",
            fontWeight: 700,
            maxWidth: "calc(100% - 12px)",
            "& .MuiChip-label": { px: 0.5 },
          }}
        />
      ) : null}

      {hasBatches ? (
        <Chip
          label={
            item.batch_count && item.batch_count > 0
              ? `${item.batch_count} batch${item.batch_count === 1 ? "" : "es"}`
              : "Batched"
          }
          size="small"
          color="info"
          variant="outlined"
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 1,
            height: 22,
            fontSize: "0.62rem",
            fontWeight: 700,
            bgcolor: "rgba(255,255,255,0.92)",
          }}
        />
      ) : null}

      <Box
        sx={{
          width: "100%",
          height: isLarge ? 130 : 96,
          borderRadius: 1,
          bgcolor: "var(--surface-bg-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          mb: isLarge ? 1 : 0.75,
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={item.description}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {item.item_number}
          </Typography>
        )}
      </Box>

      <Typography
        variant={isLarge ? "body2" : "caption"}
        sx={{ fontWeight: 700, color: "var(--surface-text)" }}
        noWrap
      >
        {item.item_number}
      </Typography>

      <Typography
        variant={isLarge ? "subtitle1" : "body2"}
        sx={{
          fontWeight: 700,
          color: "#1565c0",
          lineHeight: 1.25,
          mt: 0.25,
          mb: 0.5,
          px: 0.25,
          display: "-webkit-box",
          WebkitLineClamp: isLarge ? 2 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: isLarge ? "2.5em" : "2.4em",
          fontSize: isLarge ? "0.95rem" : undefined,
        }}
      >
        {item.description}
      </Typography>

      {showBothPrices ? (
        <Box sx={{ width: "100%" }}>
          <Typography variant="caption" sx={priceLineSx(salesType === "Retail", isLarge)}>
            Retail {formatPricePerUom(retailPrice, item.uom)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ ...priceLineSx(salesType === "Wholesale", isLarge), display: "block" }}
          >
            Wholesale {formatPricePerUom(wholesalePrice, item.uom)}
          </Typography>
        </Box>
      ) : (
        <Typography variant={isLarge ? "subtitle1" : "subtitle2"} sx={priceLineSx(true, isLarge)}>
          {salesType === "Wholesale" ? "Wholesale " : "Retail "}
          {formatPricePerUom(activePrice, item.uom)}
        </Typography>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mb: 0.35 }}>
        <ItemExpiryChip item={item} />
      </Box>

      <Typography
        variant={isLarge ? "body2" : "caption"}
        sx={{
          textAlign: "center",
          color: expired || outOfStock ? "error.main" : "text.primary",
          fontWeight: 600,
          mt: 0.35,
        }}
      >
        {expired
          ? "Expired — write off in inventory"
          : outOfStock
            ? "Out of stock"
            : `Stock ${formatStockQty(stockQty, item.uom)}`}
      </Typography>

      {onOpenBatches ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", fontSize: "0.62rem", mt: 0.25 }}
        >
          {hasBatches ? "Layers = inventory & batches" : "Layers = branch stock"}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          mt: 0.5,
          pt: 0.5,
          borderTop: "1px solid #e8edf2",
        }}
      >
        <IconButton
          size="small"
          color="error"
          disabled={blocked || cartQty <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove from cart"
          sx={{
            bgcolor: cartQty > 0 ? "#ffebee" : "transparent",
            "&:hover": { bgcolor: "var(--tint-danger-hover-bg)" },
          }}
        >
          <RemoveShoppingCartIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="body2"
          sx={{
            minWidth: 28,
            textAlign: "center",
            fontWeight: 700,
            color: inCart ? "#1565c0" : "text.secondary",
          }}
        >
          {cartQty > 0 ? cartQty : "—"}
        </Typography>
        <IconButton
          size="small"
          color="primary"
          disabled={blocked}
          onClick={(e) => {
            e.stopPropagation();
            if (!blocked) onAddMain();
          }}
          aria-label="Add main product to cart"
          sx={{
            bgcolor: "var(--tint-info-bg)",
            "&:hover": { bgcolor: "var(--pallet-lighter-blue)" },
          }}
        >
          <AddShoppingCartIcon fontSize="small" />
        </IconButton>
        {onOpenBatches ? (
          <Tooltip title="Inventory & batches">
            <IconButton
              size="small"
              color="info"
              disabled={blocked}
              onClick={(e) => {
                e.stopPropagation();
                if (!blocked) onOpenBatches();
              }}
              aria-label="Open batch list"
              sx={{
                bgcolor: "var(--tint-info-bg)",
                "&:hover": { bgcolor: "var(--pallet-lighter-blue)" },
              }}
            >
              <LayersIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
};

export default PosProductCard;
