import React from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const sectionSx = {
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: "4px",
  mb: 2,
  overflow: "hidden",
};

export const OfferSection: React.FC<{
  title: string;
  children: React.ReactNode;
  showAttach?: boolean;
}> = ({ title, children, showAttach }) => (
  <Box sx={sectionSx}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.25,
        borderBottom: "1px solid var(--surface-border)",
        bgcolor: "var(--surface-bg-alt)",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {showAttach && (
        <IconButton size="small" aria-label="Attach">
          <AttachFileIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

export const OfferToggleBar: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}> = ({ label, checked, onChange, children }) => (
  <Box sx={{ ...sectionSx, mb: children ? 2 : 2 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderBottom: children && checked ? "1px solid #e0e0e0" : "none",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        color="success"
        size="small"
      />
    </Box>
    {children && checked && <Box sx={{ p: 2 }}>{children}</Box>}
  </Box>
);

export const OfferRuleRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}> = ({ label, checked, onChange, children }) => (
  <Box
    sx={{
      border: "1px solid #e8e8e8",
      borderRadius: "4px",
      mb: 1,
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        px: 2,
        py: 1.25,
        bgcolor: checked ? "#f9fdf9" : "#fff",
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, pt: 0.5 }}>
        {label}
      </Typography>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        color="success"
        size="small"
      />
    </Box>
    {children && checked && (
      <Box sx={{ px: 2, pb: 2, pt: 0, borderTop: "1px solid #eee" }}>{children}</Box>
    )}
  </Box>
);

export const InlineNumberField: React.FC<{
  value: number;
  onChange: (v: number) => void;
  width?: number;
}> = ({ value, onChange, width = 56 }) => (
  <TextField
    size="small"
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value) || 0)}
    inputProps={{ min: 0, style: { textAlign: "center", padding: "6px 4px" } }}
    sx={{ width, mx: 0.5, verticalAlign: "middle" }}
  />
);

export const SelectProductButton: React.FC<{
  productName?: string;
  onSelect: () => void;
}> = ({ productName, onSelect }) => (
  <Button
    variant="outlined"
    size="small"
    onClick={onSelect}
    sx={{
      mx: 0.5,
      minWidth: 140,
      textTransform: "none",
      borderColor: "var(--surface-border)",
      color: "text.secondary",
      fontSize: "0.75rem",
    }}
  >
    {productName || "SELECT PRODUCT"}
  </Button>
);

export const DiscountTypeSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <MenuItem value="product">Product</MenuItem>
      <MenuItem value="order">Order</MenuItem>
    </Select>
  </FormControl>
);

export const OfferPricingModeSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      displayEmpty
    >
      <MenuItem value="both">Retail &amp; Wholesale</MenuItem>
      <MenuItem value="retail">Retail only</MenuItem>
      <MenuItem value="wholesale">Wholesale only</MenuItem>
    </Select>
  </FormControl>
);
