import React from "react";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export function filterCatalogSearch(
  term: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  const hay = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

interface CatalogBrowseGridProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  maxHeight?: number | "fill";
  minTileWidth?: number;
  gridGap?: number;
  onSearchSubmit?: () => void;
  searchHelperText?: string;
}

const CatalogBrowseGrid: React.FC<CatalogBrowseGridProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = "Search categories…",
  children,
  isEmpty = false,
  emptyMessage = "No matches found.",
  maxHeight = 420,
  minTileWidth = 140,
  gridGap = 1.5,
  onSearchSubmit,
  searchHelperText,
}) => {
  const scrollSx =
    maxHeight === "fill"
      ? { flex: 1, minHeight: 0, overflowY: "auto" as const, overflowX: "hidden" as const, pr: 0.5 }
      : {
          maxHeight,
          overflowY: "auto" as const,
          overflowX: "hidden" as const,
          pr: 0.5,
        };

  return (
  <Box sx={maxHeight === "fill" ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } : undefined}>
    <TextField
      fullWidth
      size="small"
      placeholder={searchPlaceholder}
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSearchSubmit?.();
        }
      }}
      helperText={searchHelperText}
      sx={{ mb: 1.5 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
    />
    <Box
      sx={{
        ...scrollSx,
        "&::-webkit-scrollbar": { width: 8 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "#c5c5c5",
          borderRadius: 4,
        },
      }}
    >
      {isEmpty ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
            gap: gridGap,
            pb: 0.5,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  </Box>
  );
};

export default CatalogBrowseGrid;
