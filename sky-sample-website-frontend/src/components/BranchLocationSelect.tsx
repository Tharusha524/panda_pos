import React from "react";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useBranchLocations } from "../hooks/useBranchLocations";
import { setActiveLocation } from "../utils/posActiveLocation";

interface BranchLocationSelectProps {
  value: string;
  onChange: (location: string) => void;
  label?: string;
  size?: "small" | "medium";
  minWidth?: number;
  extraLocations?: string[];
  branchesOnly?: boolean;
  showAllOption?: boolean;
  disabled?: boolean;
}

const BranchLocationSelect: React.FC<BranchLocationSelectProps> = ({
  value,
  onChange,
  label = "Branch / Location",
  size = "small",
  minWidth = 180,
  extraLocations = [],
  branchesOnly = false,
  showAllOption = false,
  disabled = false,
}) => {
  const { locations, manageMultiple, isLoading } = useBranchLocations(extraLocations, {
    branchesOnly,
  });

  const handleChange = (e: SelectChangeEvent<string>) => {
    const next = e.target.value;
    onChange(next);
    if (next !== "all") {
      setActiveLocation(next);
    }
  };

  if (!manageMultiple) {
    return null;
  }

  return (
    <FormControl size={size} sx={{ minWidth }} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={handleChange}>
        {showAllOption && <MenuItem value="all">All branches</MenuItem>}
        {locations.map((loc) => (
          <MenuItem key={loc} value={loc}>
            {loc}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default BranchLocationSelect;
