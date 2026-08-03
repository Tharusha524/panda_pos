import React from "react";
import { Box, Typography } from "@mui/material";

const sectionSx = {
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: "4px",
  mb: 2,
  overflow: "hidden",
};

export const PaymentSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Box sx={sectionSx}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.25,
        borderBottom: "1px solid var(--surface-border)",
        bgcolor: "var(--surface-bg-alt)",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

export const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "var(--surface-bg)" } };
