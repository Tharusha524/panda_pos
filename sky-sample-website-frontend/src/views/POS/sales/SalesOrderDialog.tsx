import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getItems, type Item } from "../../../api/itemsApi";
import { getItemSettings } from "../../../api/Settings/itemSettingsApi";
import { CATEGORY_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

interface SalesOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

interface OrderLine {
  item: Item;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

const SalesOrderDialog: React.FC<SalesOrderDialogProps> = ({ open, onClose }) => {
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [editingTotalFor, setEditingTotalFor] = useState<number | null>(null);
  const [totalInput, setTotalInput] = useState("");

  const { data: itemSettings } = useQuery({
    queryKey: ["item-settings"],
    queryFn: getItemSettings,
    enabled: open,
  });

  const { data: itemsData } = useQuery({
    queryKey: ["items", "sales"],
    queryFn: () => getItems(),
    enabled: open,
  });

  const items = itemsData?.items ?? [];
  const allowQuickAdd = itemSettings?.allow_quick_add_item_in_sales_screen !== false;
  const allowFavorites = itemSettings?.allow_favorite_items_on_sales_screen !== false;
  const allowTotalPrice = itemSettings?.allow_total_price_entry_on_sales_screen !== false;
  const allowDiscount = itemSettings?.allow_item_discount !== false;

  const favoriteItems = useMemo(
    () => (allowFavorites ? items.filter((i) => i.is_favourite) : []),
    [items, allowFavorites]
  );

  const searchOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    return items
      .filter(
        (i) =>
          i.item_number.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.sku ?? "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [items, search]);

  const addLine = (item: Item) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id
            ? { ...l, qty: l.qty + 1, totalPrice: (l.qty + 1) * l.unitPrice }
            : l
        );
      }
      const unit = item.selling_price;
      return [...prev, { item, qty: 1, unitPrice: unit, totalPrice: unit }];
    });
    setSearch("");
  };

  const applyTotalPrice = (itemId: number) => {
    const total = parseFloat(totalInput);
    if (Number.isNaN(total) || total <= 0) return;
    setLines((prev) =>
      prev.map((l) => {
        if (l.item.id !== itemId) return l;
        const qty = l.unitPrice > 0 ? total / l.unitPrice : l.qty;
        return { ...l, qty: Math.max(0.01, qty), totalPrice: total };
      })
    );
    setEditingTotalFor(null);
    setTotalInput("");
  };

  const orderTotal = lines.reduce((s, l) => s + l.totalPrice, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper" sx={CATEGORY_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        Sales Order
      </DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <TextField
          fullWidth
          size="small"
          label="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />

        <Autocomplete
          freeSolo
          options={searchOptions}
          getOptionLabel={(opt) =>
            typeof opt === "string" ? opt : `${opt.item_number} — ${opt.description}`
          }
          inputValue={search}
          onInputChange={(_, v) => setSearch(v)}
          onChange={(_, value) => {
            if (value && typeof value !== "string") addLine(value);
          }}
          renderInput={(params) => (
            <TextField {...params} size="small" label="Search item (number, name, SKU)" />
          )}
          sx={{ mb: 2 }}
        />

        {allowQuickAdd && search.trim() && searchOptions.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No item found.{" "}
            <Button
              component={Link}
              to="/items/new"
              size="small"
              startIcon={<AddIcon />}
              sx={{ textTransform: "none" }}
            >
              Quick add item
            </Button>
          </Alert>
        )}

        {allowFavorites && favoriteItems.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Favourite items
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {favoriteItems.map((item) => (
                <Chip
                  key={item.id}
                  icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                  label={item.description}
                  onClick={() => addLine(item)}
                  clickable
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {lines.length > 0 && (
          <Box sx={{ border: "1px solid var(--surface-border)", borderRadius: 1, p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Order lines
            </Typography>
            {lines.map((line) => (
              <Grid container spacing={1} key={line.item.id} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">{line.item.description}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rs {line.unitPrice.toFixed(2)} / unit
                    {allowDiscount && line.item.default_discount
                      ? ` · Discount ${line.item.default_discount}%`
                      : ""}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={2}>
                  <TextField
                    size="small"
                    label="Qty"
                    type="number"
                    value={line.qty}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      setLines((prev) =>
                        prev.map((l) =>
                          l.item.id === line.item.id
                            ? { ...l, qty, totalPrice: qty * l.unitPrice }
                            : l
                        )
                      );
                    }}
                    inputProps={{ min: 0.01, step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={4} sm={2}>
                  {allowTotalPrice && editingTotalFor === line.item.id ? (
                    <TextField
                      size="small"
                      label="Total Rs"
                      value={totalInput}
                      onChange={(e) => setTotalInput(e.target.value)}
                      onBlur={() => applyTotalPrice(line.item.id)}
                      onKeyDown={(e) => e.key === "Enter" && applyTotalPrice(line.item.id)}
                      autoFocus
                    />
                  ) : (
                    <Typography variant="body2">Rs {line.totalPrice.toFixed(2)}</Typography>
                  )}
                </Grid>
                <Grid item xs={4} sm={2}>
                  {allowTotalPrice && (
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingTotalFor(line.item.id);
                        setTotalInput(String(line.totalPrice));
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Edit total
                    </Button>
                  )}
                </Grid>
              </Grid>
            ))}
            <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 700, mt: 1 }}>
              Total: Rs {orderTotal.toFixed(2)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onClose} sx={POS_PRIMARY_BUTTON_SX}>
          Save order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderDialog;
