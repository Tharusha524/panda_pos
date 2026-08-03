import type { SvgIconComponent } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import HistoryIcon from "@mui/icons-material/History";

export const USER_SETTINGS_BASE = "/settings/user";

export interface UserModelShortcut {
  title: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
}

export const USER_MODEL_SHORTCUTS: UserModelShortcut[] = [
  {
    title: "User Profile",
    description: "Your name, email, phone, and security",
    path: "profile",
    icon: PersonIcon,
  },
  {
    title: "Employee Users",
    description: "Create staff logins (email + password) and assign a role",
    path: "users",
    icon: GroupIcon,
  },
  {
    title: "Roles & Access",
    description: "Define what each role can see in the POS menu",
    path: "roles",
    icon: BadgeIcon,
  },
  {
    title: "Login History",
    description: "View user sign-ins with email and IP address",
    path: "login-history",
    icon: HistoryIcon,
  },
];
