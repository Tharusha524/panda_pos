import React from "react";
import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

interface RadioOption {
  value: string;
  label: string;
}

interface SettingsRadioRowProps {
  title: string;
  description: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SettingsRadioRow: React.FC<SettingsRadioRowProps> = ({
  title,
  description,
  value,
  options,
  onChange,
  disabled = false,
}) => (
  <Box
    sx={{
      p: 2,
      mb: 1.5,
      bgcolor: "var(--surface-bg)",
      border: "1px solid var(--surface-border)",
      borderRadius: "4px",
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
      {description}
    </Typography>
    <RadioGroup
      row
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <FormControlLabel
          key={opt.value}
          value={opt.value}
          control={<Radio size="small" disabled={disabled} />}
          label={opt.label}
        />
      ))}
    </RadioGroup>
  </Box>
);

export default SettingsRadioRow;
