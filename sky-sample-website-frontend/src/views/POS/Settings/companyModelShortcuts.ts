import type { SvgIconComponent } from "@mui/icons-material";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LanguageIcon from "@mui/icons-material/Language";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { APP_INFO } from "../../../config/appInfo";

export const COMPANY_SETTINGS_BASE = "/settings/company";

export interface CompanyModelShortcut {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
  actionLabel: string;
}

export const COMPANY_MODEL_SHORTCUTS: CompanyModelShortcut[] = [
  {
    title: "Company",
    description:
      `${APP_INFO.applicationName} supports different industries. Here you can add your industry's information.`,
    path: "manage",
    icon: BusinessIcon,
    actionLabel: "Manage company",
  },
  {
    title: "Branch",
    description:
      "You can add your branch's details. By clicking on add, you can add new branches.",
    path: "branch",
    icon: StorefrontIcon,
    actionLabel: "Manage branch",
  },
  {
    title: "Currency & Language",
    description: "Select your currency and language.",
    path: "currency-language",
    icon: LanguageIcon,
    actionLabel: "Manage language",
  },
  {
    title: "Alert notifications",
    description:
      "Company owner: set up main email (SMTP) and SMS. Alerts go to company contact and employees.",
    path: "notifications",
    icon: NotificationsActiveIcon,
    actionLabel: "Configure alerts",
  },
];
