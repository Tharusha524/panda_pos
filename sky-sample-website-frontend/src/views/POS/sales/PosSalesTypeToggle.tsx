import React from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { PosSalesPriceMode } from "./posSalePricing";

interface PosSalesTypeToggleProps {
  value: PosSalesPriceMode;
  onChange: (mode: PosSalesPriceMode) => void;
  allowWholesale?: boolean;
  compact?: boolean;
}

const PosSalesTypeToggle: React.FC<PosSalesTypeToggleProps> = ({
  value,
  onChange,
  allowWholesale = true,
  compact = false,
}) => {
  if (!allowWholesale) {
    return (
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
        Retail pricing
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {!compact ? (
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
          Price
        </Typography>
      ) : null}
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, next: PosSalesPriceMode | null) => {
          if (next) onChange(next);
        }}
        sx={{
          bgcolor:
            value === "Wholesale"
              ? "#e8f5e9"
              : value === "Retail"
                ? "#e3f2fd"
                : "#f0f4f8",
          borderRadius: 1,
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.75rem",
            px: 1.5,
            py: 0.35,
            border: "1px solid #cfd8e3",
            color: "#444",
            "&.Mui-selected": {
              bgcolor:
                value === "Wholesale"
                  ? "#c8e6c9"
                  : "#bbdefb",
              color: value === "Wholesale" ? "#1b5e20" : "#0d47a1",
              borderColor: value === "Wholesale" ? "#81c784" : "#64b5f6",
              "&:hover": {
                bgcolor: value === "Wholesale" ? "#a5d6a7" : "#90caf9",
              },
            },
          },
        }}
      >
        <ToggleButton value="Retail">Retail</ToggleButton>
        <ToggleButton value="Wholesale">Wholesale</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default PosSalesTypeToggle;
