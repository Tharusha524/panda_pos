import type { SvgIconComponent } from "@mui/icons-material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentIcon from "@mui/icons-material/Payment";

export const NOTIFICATION_SETTINGS_BASE = "/settings/notification";

export interface NotificationModelShortcut {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
  actionLabel: string;
}

export const NOTIFICATION_MODEL_SHORTCUTS: NotificationModelShortcut[] = [
  {
    title: "Customer Sales Notifications",
    description: "Custom email and SMS notifications for sales orders",
    path: "sales",
    icon: ShoppingCartIcon,
    actionLabel: "Manage sales notifications",
  },
  {
    title: "Customer Payment Notifications",
    description: "Custom email and SMS notifications for payments",
    path: "payment",
    icon: PaymentIcon,
    actionLabel: "Manage payment notifications",
  },
];
