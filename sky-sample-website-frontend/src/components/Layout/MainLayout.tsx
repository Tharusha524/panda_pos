import * as React from "react";
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { Badge, Stack, useMediaQuery } from "@mui/material";
import { useState, useEffect } from "react";
import useCurrentUser from "../../hooks/useCurrentUser";
import useCompanyLogo from "../../hooks/useCompanyLogo";
import useFaviconSync from "../../hooks/useFaviconSync";
import { useColorMode } from "../../state/colorMode";
import "./MainLayout.css";
import ViewUserContent from "../../views/Administration/ViewUserProfileContent";
import ViewProfileDataDrawer, {
  DrawerProfileHeader,
} from "../ViewProfileDataDrawer";
import ProfileImage from "../ProfileImageComponent";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export const DRAWER_WIDTH = 280;
export const DRAWER_COLLAPSED_WIDTH = 76;

const drawerPaperMixin = (theme: Theme, width: number): CSSObject => ({
  width,
  boxSizing: "border-box",
  overflowX: "hidden",
  border: "none",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

interface AppBarProps extends MuiAppBarProps {
  drawerWidth?: number;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "drawerWidth",
})<AppBarProps>(({ theme, drawerWidth = DRAWER_WIDTH }) => ({
  zIndex: theme.zIndex.drawer,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.palette.mode === "dark"
    ? "0 1px 0 rgba(255, 255, 255, 0.08)"
    : "0 1px 0 rgba(0, 0, 0, 0.06)",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.up("md")]: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  },
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "drawerWidth",
})<{ drawerWidth: number }>(({ theme, drawerWidth }) => ({
  width: drawerWidth,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    ...drawerPaperMixin(theme, drawerWidth),
    [theme.breakpoints.up("md")]: {
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
    },
    [theme.breakpoints.down("md")]: {
      width: DRAWER_WIDTH,
    },
  },
}));

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  minWidth: 0,
  padding: theme.spacing(3),
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
  boxSizing: "border-box",
}));

interface Props {
  children: React.ReactNode;
}

export default React.memo(function MainLayout({ children }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user } = useCurrentUser();
  const { logoUrl, companyName } = useCompanyLogo();
  useFaviconSync();
  const { mode, toggleColorMode } = useColorMode();
  const [openViewProfileDrawer, setOpenViewProfileDrawer] = useState(false);
  const statusColor = user?.availability ? "#44b700" : "#f44336";

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const drawerWidth = isMobile
    ? DRAWER_WIDTH
    : desktopOpen
      ? DRAWER_WIDTH
      : DRAWER_COLLAPSED_WIDTH;

  const collapsed = !isMobile && !desktopOpen;

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar position="fixed" drawerWidth={isMobile ? 0 : drawerWidth}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
              <IconButton
                aria-label="Toggle navigation"
                onClick={handleMenuClick}
                edge="start"
                sx={{ color: "var(--pallet-blue)", mr: { xs: 1, sm: 2 } }}
              >
                <MenuIcon />
              </IconButton>
              {logoUrl && (
                <Box
                  component="img"
                  src={logoUrl}
                  alt="Company logo"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    height: 32,
                    maxWidth: 120,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  color: "var(--pallet-blue)",
                  fontWeight: 600,
                  display: { xs: "block", md: "none" },
                  ml: 1,
                }}
                noWrap
              >
                {companyName}
              </Typography>
            </Box>

            {!isMobile && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: { xs: "none", lg: "block" },
                  fontWeight: 500,
                }}
              >
                Smart retail · Inventory · Reports
              </Typography>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton
                  aria-label="Toggle dark mode"
                  onClick={toggleColorMode}
                  sx={{ color: "var(--pallet-blue)" }}
                >
                  {mode === "dark" ? (
                    <LightModeRoundedIcon fontSize="small" />
                  ) : (
                    <DarkModeRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <NotificationBell />
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: statusColor,
                    boxShadow: "0 0 0 2px white",
                    height: 8,
                    width: 8,
                  },
                }}
              >
                <ProfileImage
                  name={user?.name}
                  files={user?.profileImage}
                  size="2.25rem"
                  onClick={() => setOpenViewProfileDrawer(true)}
                />
              </Badge>
            </Box>

            <ViewProfileDataDrawer
              open={openViewProfileDrawer}
              handleClose={() => setOpenViewProfileDrawer(false)}
              fullScreen
              drawerContent={
                <Stack spacing={1} sx={{ px: theme.spacing(1) }}>
                  <DrawerProfileHeader
                    title="User Profile"
                    handleClose={() => setOpenViewProfileDrawer(false)}
                    onEdit={() => {}}
                  />
                  <ViewUserContent selectedUser={user} />
                </Stack>
              }
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        aria-label="Sidebar"
        sx={{
          width: { xs: 0, md: drawerWidth },
          flexShrink: 0,
        }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          drawerWidth={isMobile ? DRAWER_WIDTH : drawerWidth}
          sx={{
            "& .MuiDrawer-paper": {
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            },
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setDesktopOpen((prev) => !prev)}
            onCloseMobile={() => setMobileOpen(false)}
            showCollapseControl={!isMobile}
            isMobile={isMobile}
          />
        </Drawer>
      </Box>

      <Main>
        <Toolbar />
        {children}
      </Main>
    </Box>
  );
});
