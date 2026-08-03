import React from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import type { ItemSubCategoryRef } from "../../../api/itemsApi";

export type PosSubCategoryTab = "all" | number;

interface PosSubCategoryTabsProps {
  subCategories: ItemSubCategoryRef[];
  parentLabel?: string;
  activeSubTab: PosSubCategoryTab;
  onChange: (tab: PosSubCategoryTab) => void;
}

const tabSx = {
  minHeight: 34,
  textTransform: "none" as const,
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "#555",
  px: 1.25,
  py: 0.25,
  "&.Mui-selected": {
    color: "#0f4c81",
    bgcolor: "var(--tint-info-bg)",
  },
};

const PosSubCategoryTabs: React.FC<PosSubCategoryTabsProps> = ({
  subCategories,
  parentLabel,
  activeSubTab,
  onChange,
}) => {
  if (subCategories.length === 0) return null;

  const tabValue = activeSubTab === "all" ? "all" : String(activeSubTab);

  return (
    <Box
      sx={{
        borderBottom: "1px solid #e8ecf0",
        bgcolor: "var(--surface-bg-alt)",
        mx: -1.5,
        px: 1.5,
        pt: 0.5,
      }}
    >
      {parentLabel ? (
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", px: 0.5 }}>
          Sub categories — {parentLabel}
        </Typography>
      ) : (
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", px: 0.5 }}>
          Sub categories
        </Typography>
      )}
      <Tabs
        value={tabValue}
        onChange={(_, v) => {
          if (v === "all") onChange("all");
          else onChange(Number(v));
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 34,
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": tabSx,
          "& .MuiTab-root.Mui-selected": { borderRadius: 1 },
        }}
      >
        <Tab label="All" value="all" />
        {subCategories.map((sub) => (
          <Tab key={sub.id} label={sub.name} value={String(sub.id)} />
        ))}
      </Tabs>
    </Box>
  );
};

export default PosSubCategoryTabs;
