import React from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router";
import PageTitle from "../../../components/PageTitle";
import InventorySettingsForm from "./InventorySettingsForm";
import { INVENTORY_BASE_PATH } from "./inventoryShortcuts";

const InventorySettingsPage: React.FC = () => (
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    <Button
      component={Link}
      to={INVENTORY_BASE_PATH}
      startIcon={<ArrowBackIcon />}
      sx={{ mb: 2, textTransform: "none", color: "text.secondary" }}
    >
      Back to Inventory
    </Button>
    <PageTitle
      title="Inventory"
      subtitle="Update your inventory more details"
    />
    <InventorySettingsForm />
  </Box>
);

export default InventorySettingsPage;
