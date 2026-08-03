import React from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router";
import PageTitle from "../../../components/PageTitle";
import ItemSettingsForm from "./ItemSettingsForm";

const ITEMS_BASE = "/items";

const ItemSettingsPage: React.FC = () => (
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    <Button
      component={Link}
      to={ITEMS_BASE}
      startIcon={<ArrowBackIcon />}
      sx={{ mb: 2, textTransform: "none", color: "text.secondary" }}
    >
      Back to Items
    </Button>
    <PageTitle
      title="Item Settings"
      subtitle="Product fields, units of measure, discounts, and sales options"
    />
    <ItemSettingsForm />
  </Box>
);

export default ItemSettingsPage;
