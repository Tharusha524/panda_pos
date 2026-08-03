import React from "react";
import { Box, Switch, Typography } from "@mui/material";

interface SettingsToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      p: 2,
      mb: 1.5,
      bgcolor: "var(--surface-bg)",
      border: "1px solid var(--surface-border)",
      borderRadius: "4px",
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Switch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      color="success"
    />
  </Box>
);

export default SettingsToggleRow;
