import React from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import type { Item } from "../../../api/itemsApi";
import { resolveItemImageUrl } from "../../../utils/resolveStorageUrl";
import { boxTileSelectedSx, boxTileSx } from "../sales/posSaleConstants";
import { formatUomLabel, qtyInputPropsForUom } from "../sales/posSaleUom";
import { formatPurchasePricePerUom } from "./purchaseFormUtils";
import {
  formatAfterStock,
  formatAvailableStock,
  formatBuyingStock,
  purchaseAvailableStock,
} from "./purchaseStockUtils";

interface PurchaseProductCardProps {
  item: Item;
  inCart: boolean;
  cartQty?: number;
  variant?: "default" | "large";
  onAdd: () => void;
  onSetQty?: (qty: number) => void;
  onQtyDelta?: (delta: number) => void;
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
  cursor: "pointer",
  "&:hover": {
    borderColor: "#5a9fc9",
    boxShadow: "0 2px 8px rgba(0,80,140,0.12)",
  },
};

const PurchaseProductCard: React.FC<PurchaseProductCardProps> = ({
  item,
  inCart,
  cartQty = 0,
  variant = "default",
  onAdd,
  onSetQty,
  onQtyDelta,
}) => {
  const isLarge = variant === "large";
  const available = purchaseAvailableStock(item);
  const unitPrice = item.purchase_price ?? item.last_purchase_price ?? 0;
  const imageUrl = resolveItemImageUrl(item);
  const qtyInput = qtyInputPropsForUom(item.uom);
  const buying = inCart ? cartQty : 0;

  const tileSx = inCart
    ? {
        ...cardBaseSx,
        minHeight: isLarge ? 300 : 220,
        p: isLarge ? 1.25 : 1,
        ...boxTileSelectedSx,
        borderColor: "#1565c0",
        bgcolor: "var(--tint-info-bg)",
      }
    : {
        ...cardBaseSx,
        minHeight: isLarge ? 260 : 168,
        p: isLarge ? 1.25 : 1,
      };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <Box sx={tileSx} onClick={() => !inCart && onAdd()}>
      <Box
        sx={{
          width: "100%",
          height: isLarge ? 120 : 88,
          borderRadius: 1,
          bgcolor: "var(--surface-bg-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          mb: 0.75,
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

      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--surface-text)" }} noWrap>
        {item.item_number}
      </Typography>

      <Typography
        variant={isLarge ? "body2" : "caption"}
        sx={{
          fontWeight: 700,
          color: "#1565c0",
          lineHeight: 1.2,
          mt: 0.25,
          mb: 0.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.description}
      </Typography>

      <Typography variant="caption" sx={{ fontWeight: 700, color: "#c62828", textAlign: "center" }}>
        {formatPurchasePricePerUom(unitPrice, item.uom)}
      </Typography>

      <Box sx={{ mt: 0.5, px: 0.25 }}>
        <Typography variant="caption" display="block" color="text.secondary">
          Available: {formatAvailableStock(item)}
        </Typography>
        {inCart ? (
          <>
            <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: "#2e7d32" }}>
              Buying: {formatBuyingStock(buying, item.uom)}
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: "#1565c0" }}>
              After: {formatAfterStock(available, buying, item.uom)}
            </Typography>
          </>
        ) : null}
      </Box>

      {inCart && onSetQty && onQtyDelta ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.25,
            mt: 0.75,
            pt: 0.75,
            borderTop: "1px solid #cfe0f5",
          }}
          onClick={stop}
        >
          <IconButton size="small" onClick={() => onQtyDelta(-1)}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={cartQty}
            onChange={(e) => onSetQty(parseFloat(e.target.value) || 0)}
            onClick={stop}
            inputProps={{ min: qtyInput.min, step: qtyInput.step }}
            sx={{ width: 68, "& input": { textAlign: "center", py: 0.4, px: 0.25 } }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 18 }}>
            {formatUomLabel(item.uom)}
          </Typography>
          <IconButton size="small" onClick={() => onQtyDelta(1)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Typography
          variant="caption"
          sx={{ textAlign: "center", color: "text.secondary", mt: 0.75, display: "block" }}
        >
          Tap to add
        </Typography>
      )}
    </Box>
  );
};

export default PurchaseProductCard;
