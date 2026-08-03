import React from "react";
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, startOfMonth } from "date-fns";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { getActiveLocation } from "../../../utils/posActiveLocation";

export interface ReportFilterValues {
  dateFrom: Date;
  dateTo: Date;
  location: string;
}

interface ReportFiltersProps {
  values: ReportFilterValues;
  onChange: (values: ReportFilterValues) => void;
  onApply: () => void;
  loading?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  values,
  onChange,
  onApply,
  loading,
}) => {
  const { locations, manageMultiple, isLoading } = useBranchLocations();

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: "var(--surface-bg-alt)", borderRadius: 2, border: "1px solid var(--surface-border)" }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="From"
            value={values.dateFrom}
            onChange={(d) => d && onChange({ ...values, dateFrom: d })}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="To"
            value={values.dateTo}
            onChange={(d) => d && onChange({ ...values, dateTo: d })}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth disabled={isLoading}>
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={values.location}
              onChange={(e) => onChange({ ...values, location: e.target.value })}
            >
              {manageMultiple && <MenuItem value="all">All branches</MenuItem>}
              {locations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button variant="contained" fullWidth onClick={onApply} disabled={loading || isLoading}>
            {loading ? "Loading…" : "Run Report"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export function defaultReportFilters(): ReportFilterValues {
  const today = new Date();
  const active = getActiveLocation();

  return {
    dateFrom: startOfMonth(today),
    dateTo: today,
    location: active,
  };
}

export function filtersToParams(values: ReportFilterValues) {
  return {
    dateFrom: format(values.dateFrom, "yyyy-MM-dd"),
    dateTo: format(values.dateTo, "yyyy-MM-dd"),
    location: values.location === "all" ? null : values.location,
  };
}

export default ReportFilters;
