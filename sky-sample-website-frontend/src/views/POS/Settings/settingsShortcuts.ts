import type { SvgIconComponent } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DevicesIcon from "@mui/icons-material/Devices";
import BadgeIcon from "@mui/icons-material/Badge";
import StoreIcon from "@mui/icons-material/Store";
import BuildIcon from "@mui/icons-material/Build";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import InfoIcon from "@mui/icons-material/Info";
import ApiIcon from "@mui/icons-material/Api";
import BackupIcon from "@mui/icons-material/Backup";

export interface SettingsShortcut {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
}

export const SETTINGS_BASE_PATH = "/settings";

export const SETTINGS_SHORTCUTS: SettingsShortcut[] = [
  {
    title: "User",
    description: "Profile, role, and account security",
    path: "user",
    icon: PersonIcon,
  },
  {
    title: "Company",
    description: "Business details, address, and tax info",
    path: "company",
    icon: BusinessIcon,
  },
  {
    title: "Item",
    description: "Product fields, SKU, and stock thresholds",
    path: "item",
    icon: CategoryIcon,
  },
  {
    title: "Inventory",
    description: "Locations, costing method, TOG, and RFQ options",
    path: "inventory",
    icon: Inventory2Icon,
  },
  {
    title: "Order",
    description: "Sales screen, payment, offers, and hold orders",
    path: "order",
    icon: ShoppingCartIcon,
  },
  {
    title: "Hardware",
    description: "Printers, receipt layout, logos, and cash drawer",
    path: "hardware",
    icon: DevicesIcon,
  },
  {
    title: "Employee",
    description: "Manage staff, phone, address, and auto numbering",
    path: "employee",
    icon: BadgeIcon,
  },
  {
    title: "Multiple Systems",
    description: "Multi-location and data sync",
    path: "multiple-systems",
    icon: StoreIcon,
  },
  {
    title: "Repair",
    description: "Repair module and warranty settings",
    path: "repair",
    icon: BuildIcon,
  },
  {
    title: "Email",
    description: "SMTP server and email templates",
    path: "email",
    icon: EmailIcon,
  },
  {
    title: "Email & SMS Notification",
    description: "Customer sales and payment notifications (email + SMS)",
    path: "notification",
    icon: SmsIcon,
  },
  {
    title: "Bank",
    description: "Manage bank accounts for payments and reconciliation",
    path: "bank",
    icon: AccountBalanceIcon,
  },
  {
    title: "Alert",
    description: "Expiry and cheque alert period in days",
    path: "alert",
    icon: WarningAmberIcon,
  },
  {
    title: "Payment",
    description: "Currency and payment methods",
    path: "payment",
    icon: PaymentIcon,
  },
  {
    title: "Tax",
    description: "VAT rates, default tax, and item assignment",
    path: "tax",
    icon: ReceiptLongIcon,
  },
  {
    title: "Subscription",
    description: "Online payment, plan, and billing history",
    path: "subscription",
    icon: CardMembershipIcon,
  },
  {
    title: "API Configuration",
    description: "Backend URL, API keys, webhooks, mobile sync, and endpoint reference",
    path: "api",
    icon: ApiIcon,
  },
  {
    title: "Backup",
    description: "Create and download database backups",
    path: "backup",
    icon: BackupIcon,
  },
  {
    title: "Info",
    description: "Sky Smart Software version and developer details",
    path: "info",
    icon: InfoIcon,
  },
];
