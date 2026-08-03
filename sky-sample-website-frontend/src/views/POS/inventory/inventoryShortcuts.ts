import type { SvgIconComponent } from "@mui/icons-material";
import CategoryIcon from "@mui/icons-material/Category";
import LayersIcon from "@mui/icons-material/Layers";
import SettingsIcon from "@mui/icons-material/Settings";

export interface InventoryShortcut {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
}

export const INVENTORY_BASE_PATH = "/inventory";

export const INVENTORY_SHORTCUTS: InventoryShortcut[] = [
  {
    title: "Inventory Settings",
    description: "Locations, FIFO/LIFO costing, TOG, RFQ, and location filters",
    path: "settings",
    icon: SettingsIcon,
  },
  {
    title: "Item",
    description: "Item master list — numbers, prices, categories, and status",
    path: "items",
    icon: CategoryIcon,
  },
  {
    title: "Categories",
    description: "Manage item categories and sub categories",
    path: "categories",
    icon: LayersIcon,
  },
];
