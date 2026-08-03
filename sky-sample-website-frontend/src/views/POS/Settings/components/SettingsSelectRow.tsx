import React from "react";
import { Box, FormControl, MenuItem, Select, TextField, Typography } from "@mui/material";

interface SelectOption {
  value: string;
  label: string;
}

interface SettingsSelectRowProps {
  title: string;
  description: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SettingsTextRow: React.FC<{
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "number";
  endAdornment?: string;
}> = ({
  title,
  description,
  value,
  onChange,
  disabled,
  type = "text",
  endAdornment,
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
    <TextField
      size="small"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      sx={{ minWidth: type === "number" ? 80 : 140 }}
      inputProps={type === "number" ? { min: 0, max: 365 } : undefined}
      InputProps={
        endAdornment
          ? {
              endAdornment: (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  {endAdornment}
                </Typography>
              ),
            }
          : undefined
      }
    />
  </Box>
);

const SettingsSelectRow: React.FC<SettingsSelectRowProps> = ({
  title,
  description,
  value,
  options,
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
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
);

export default SettingsSelectRow;
