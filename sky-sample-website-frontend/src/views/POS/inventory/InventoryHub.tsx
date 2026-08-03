import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import PageTitle from "../../../components/PageTitle";
import InventoryShortcutCard from "./components/InventoryShortcutCard";
import { INVENTORY_BASE_PATH, INVENTORY_SHORTCUTS } from "./inventoryShortcuts";

const InventoryHub: React.FC = () => (
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    <PageTitle title="Inventory" subtitle="Stock and item management" />

    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
      <InventoryIcon sx={{ color: "var(--pallet-blue)" }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Inventory shortcuts
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Select a card below to open that inventory page.
    </Typography>

    <Grid container spacing={3}>
      {INVENTORY_SHORTCUTS.map((shortcut) => (
        <Grid item xs={12} sm={6} md={4} key={shortcut.path}>
          <InventoryShortcutCard
            title={shortcut.title}
            description={shortcut.description}
            to={`${INVENTORY_BASE_PATH}/${shortcut.path}`}
            icon={shortcut.icon}
          />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default InventoryHub;
