import React from "react";
import { Box, Typography } from "@mui/material";

export const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "var(--surface-bg)" } };

interface ShippingSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "var(--pallet-blue)" }}>
      {title}
    </Typography>
    {children}
  </Box>
);
