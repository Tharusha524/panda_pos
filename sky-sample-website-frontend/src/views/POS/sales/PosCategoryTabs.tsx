import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import type { ItemCategory } from "../../../api/itemsApi";
import type { PosCategoryTab } from "./posSaleCatalogFilter";

interface PosCategoryTabsProps {
  categories: ItemCategory[];
  activeTab: PosCategoryTab;
  onChange: (tab: PosCategoryTab) => void;
}

const tabSx = {
  minHeight: 40,
  textTransform: "none" as const,
  fontWeight: 600,
  fontSize: "0.8125rem",
  color: "var(--surface-text-muted)",
  px: 1.5,
  "&.Mui-selected": {
    color: "var(--pallet-green)",
    bgcolor: "var(--tint-success-bg)",
  },
};

const PosCategoryTabs: React.FC<PosCategoryTabsProps> = ({
  categories,
  activeTab,
  onChange,
}) => {
  const tabValue =
    activeTab === "all" ? "all" : activeTab === "favourite" ? "favourite" : String(activeTab);

  return (
    <Box
      sx={{
        borderBottom: "1px solid var(--surface-border)",
        bgcolor: "var(--surface-bg)",
        mx: -1.5,
        px: 1.5,
      }}
    >
      <Tabs
        value={tabValue}
        onChange={(_, v) => {
          if (v === "all") onChange("all");
          else if (v === "favourite") onChange("favourite");
          else onChange(Number(v));
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 40,
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": tabSx,
          "& .MuiTab-root.Mui-selected": {
            borderRadius: 1,
          },
        }}
      >
        <Tab label="All" value="all" />
        <Tab label="Favourite" value="favourite" />
        {categories.map((cat) => (
          <Tab key={cat.id} label={cat.name} value={String(cat.id)} />
        ))}
      </Tabs>
    </Box>
  );
};

export default PosCategoryTabs;
