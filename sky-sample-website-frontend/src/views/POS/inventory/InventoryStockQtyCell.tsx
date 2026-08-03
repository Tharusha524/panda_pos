import React from "react";
import { Typography } from "@mui/material";
import type { Item } from "../../../api/itemsApi";
import {
  formatItemQty,
  isStockOversold,
  itemExpiredStockQty,
  itemSellableQty,
  stockOversoldQty,
  stockQtyOnHand,
} from "./itemInventoryUtils";

interface InventoryStockQtyCellProps {
  item: Pick<Item, "qty" | "uom" | "oversold_qty" | "sellable_qty" | "expired_stock_qty" | "has_expired_stock">;
  emphasizeLowStock?: boolean;
}

const InventoryStockQtyCell: React.FC<InventoryStockQtyCellProps> = ({
  item,
  emphasizeLowStock = false,
}) => {
  const rawQty = item.qty ?? 0;
  const oversold = item.oversold_qty ?? stockOversoldQty(rawQty);
  const totalOnHand = stockQtyOnHand(rawQty);
  const sellable = itemSellableQty(item);
  const expired = itemExpiredStockQty(item);
  const oversoldActive = oversold > 0.0001 || isStockOversold(rawQty);
  const hasExpiredOnHand = expired > 0.0001;

  return (
    <>
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          color: oversoldActive
            ? "error.main"
            : emphasizeLowStock
              ? "warning.main"
              : undefined,
        }}
      >
        {formatItemQty(sellable, item.uom)}
      </Typography>
      {hasExpiredOnHand ? (
        <Typography variant="caption" display="block" color="error.main" lineHeight={1.2}>
          Expired {formatItemQty(expired, item.uom)} · Total {formatItemQty(totalOnHand, item.uom)}
        </Typography>
      ) : null}
      {oversoldActive ? (
        <Typography variant="caption" display="block" color="error.main" lineHeight={1.2}>
          Short {formatItemQty(oversold, item.uom)}
        </Typography>
      ) : null}
    </>
  );
};

export default InventoryStockQtyCell;
