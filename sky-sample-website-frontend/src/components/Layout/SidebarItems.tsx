import DashboardIcon from "@mui/icons-material/Dashboard";
import LayersIcon from "@mui/icons-material/Layers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import SpaIcon from "@mui/icons-material/Spa";
import ForestIcon from "@mui/icons-material/Forest";
import ScienceIcon from "@mui/icons-material/Science";
import EmergencyIcon from "@mui/icons-material/Emergency";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import FolderIcon from "@mui/icons-material/Folder";
import ConstructionIcon from "@mui/icons-material/Construction";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PollOutlinedIcon from "@mui/icons-material/PollOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import DatasetLinkedOutlinedIcon from "@mui/icons-material/DatasetLinkedOutlined";
import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import KeyIcon from "@mui/icons-material/Key";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentIcon from "@mui/icons-material/Payment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import CategoryIcon from "@mui/icons-material/Category";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { PermissionKeys } from "../../views/Administration/SectionList";

export interface SidebarItem {
  title?: string;
  headline?: string;
  icon?: JSX.Element;
  open?: boolean;
  href?: string;
  disabled?: boolean;
  accessKey?: string;
  /** POS module permission key from role (pos.sales, etc.) */
  posKey?: string;
  nestedItems?: SidebarNestedItem[];
}

export type SidebarNestedItem = {
  title: string;
  href: string;
  icon: JSX.Element;
  accessKey?: string;
  posKey?: string;
  open?: boolean;
  disabled?: boolean;
  nestedItems?: SidebarNestedItem[];
};

export const sidebarItems: Array<SidebarItem> = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <DashboardIcon fontSize="small" />,
    posKey: "pos.dashboard",
  },
  {
    title: "Sales",
    href: "/sales",
    icon: <ShoppingCartIcon fontSize="small" />,
    posKey: "pos.sales",
  },
  {
    title: "Payments",
    href: "/payments",
    icon: <PaymentIcon fontSize="small" />,
    posKey: "pos.payments",
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: <MoneyOffIcon fontSize="small" />,
    posKey: "pos.expenses",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: <PeopleAltIcon fontSize="small" />,
    posKey: "pos.customers",
  },
  {
    title: "Items",
    href: "/items",
    icon: <CategoryIcon fontSize="small" />,
    posKey: "pos.items",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: <LayersIcon fontSize="small" />,
    posKey: "pos.inventory",
  },
  {
    title: "Purchasing",
    href: "/purchasing",
    icon: <ShoppingCartIcon fontSize="small" />,
    posKey: "pos.purchasing",
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: <LocalShippingIcon fontSize="small" />,
    posKey: "pos.suppliers",
  },
  {
    title: "Shipping",
    href: "/shipping",
    icon: <LocalShippingIcon fontSize="small" />,
    posKey: "pos.shipping",
  },
  {
    title: "Offers",
    href: "/offers",
    icon: <LocalOfferIcon fontSize="small" />,
    posKey: "pos.offers",
  },
  {
    title: "Repair",
    href: "/repair",
    icon: <BuildIcon fontSize="small" />,
    posKey: "pos.repair",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <AssignmentIcon fontSize="small" />,
    posKey: "pos.reports",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    posKey: "pos.settings",
  },
];
