import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Collapse,
  IconButton,
  List,
  Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useLocation } from "react-router";
import { useSnackbar } from "notistack";
import { SidebarItem, sidebarItems } from "./SidebarItems";
import useCurrentUser from "../../hooks/useCurrentUser";
import usePosAccess from "../../hooks/usePosAccess";
import useLogout from "../../hooks/useLogout";
import { PermissionKeysObject } from "../../views/Administration/SectionList";
import DeleteConfirmationModal from "../DeleteConfirmationModal";
import ProfileImage from "../ProfileImageComponent";
import { prefetchPosRouteForPath } from "../../routing/posRouteChunks";
import useCompanyLogo from "../../hooks/useCompanyLogo";
import "./Sidebar.css";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  showCollapseControl?: boolean;
  isMobile?: boolean;
}

export default React.memo(function Sidebar({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  showCollapseControl = true,
  isMobile = false,
}: SidebarProps) {
  const { user } = useCurrentUser();
  const performLogout = useLogout();
  const { enqueueSnackbar } = useSnackbar();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { companyName } = useCompanyLogo();

  const userPermissionObject = useMemo<PermissionKeysObject>(
    () => user?.permissionObject ?? {},
    [user]
  );
  const { can: canPos, isAdmin } = usePosAccess();

  return (
    <div className={`sidebar-root${collapsed ? " collapsed" : ""}`}>
      <SidebarBrand
        collapsed={collapsed && !isMobile}
        showCollapseControl={showCollapseControl}
        onToggleCollapse={onToggleCollapse}
        onCloseMobile={onCloseMobile}
        isMobile={isMobile}
      />

      <SidebarNavigation
        collapsed={collapsed}
        isMobile={isMobile}
        onCloseMobile={onCloseMobile}
        userPermissionObject={userPermissionObject}
        canPos={canPos}
        isAdmin={isAdmin}
      />

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user-chip">
            <ProfileImage name={user?.name} files={user?.profileImage} size="2rem" />
            <div className="sidebar-user-meta" style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.name ?? "User"}</div>
              <div className="sidebar-user-role">
                {(user as { roleModel?: { name?: string } })?.roleModel?.name ?? user?.role ?? "member"}
              </div>
            </div>
          </div>
        )}

        <Tooltip title="Log out" placement="right" disableHoverListener={!collapsed}>
          <span style={{ display: "block", width: "100%" }}>
            <button
              type="button"
              className="sidebar-logout"
              onClick={() => setLogoutDialogOpen(true)}
              aria-label="Log out"
            >
              <LogoutIcon fontSize="small" />
              <span>Log out</span>
            </button>
          </span>
        </Tooltip>
      </div>

      {logoutDialogOpen && (
        <DeleteConfirmationModal
          open={logoutDialogOpen}
          title="Log Out Confirmation"
          customDeleteButtonText="Log Out Now"
          customDeleteButtonIon={<LogoutIcon />}
          content={
            <>
              Are you sure you want to log out of {companyName}?
              <Alert severity="warning" style={{ marginTop: "1rem" }}>
                You will need to sign in again to access your account.
              </Alert>
            </>
          }
          handleClose={() => setLogoutDialogOpen(false)}
          deleteFunc={performLogout}
          onSuccess={() => {
            setLogoutDialogOpen(false);
            enqueueSnackbar("Logged out successfully!", { variant: "success" });
          }}
          handleReject={() => setLogoutDialogOpen(false)}
        />
      )}
    </div>
  );
});

const SidebarNavigation = React.memo(function SidebarNavigation({
  collapsed,
  isMobile,
  onCloseMobile,
  userPermissionObject,
  canPos,
  isAdmin,
}: {
  collapsed: boolean;
  isMobile: boolean;
  onCloseMobile?: () => void;
  userPermissionObject: PermissionKeysObject;
  canPos: (key: Parameters<ReturnType<typeof usePosAccess>["can"]>[0]) => boolean;
  isAdmin: boolean;
}) {
  const { pathname } = useLocation();

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {sidebarItems.map((item) => {
        if (item?.posKey && !isAdmin && !canPos(item.posKey as Parameters<typeof canPos>[0])) {
          return null;
        }
        if (item?.accessKey && !userPermissionObject[`${item.accessKey}`]) {
          return null;
        }

        if (item?.headline) {
          return (
            <p key={item.headline} className="sidebar-section-label">
              {item.headline}
            </p>
          );
        }

        if (item.nestedItems) {
          return (
            <NestedItem
              key={`${item.href}-${item.title}`}
              item={item}
              collapsed={collapsed}
              onCloseMobile={onCloseMobile}
              userPermissionObject={userPermissionObject}
              canPos={canPos}
              isAdmin={isAdmin}
              pathname={pathname}
            />
          );
        }

        return (
          <SidebarNavLink
            key={item.accessKey ?? item.href}
            to={item.href!}
            icon={item.icon}
            title={item.title!}
            disabled={item.disabled}
            collapsed={collapsed && !isMobile}
            onCloseMobile={onCloseMobile}
            pathname={pathname}
          />
        );
      })}
    </nav>
  );
});

function SidebarBrand({
  collapsed,
  showCollapseControl,
  onToggleCollapse,
  onCloseMobile,
  isMobile = false,
}: {
  collapsed: boolean;
  showCollapseControl?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}) {
  const { logoUrl, companyName } = useCompanyLogo();
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-mark" aria-hidden>
        <img src={logoUrl} alt="Company logo" className="sidebar-brand-logo" />
      </div>
      {!collapsed && (
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">{companyName}</div>
          <div className="sidebar-brand-sub">Point of Sale</div>
        </div>
      )}
      {(showCollapseControl || isMobile) && (
        <IconButton
          size="small"
          className="sidebar-collapse-btn"
          onClick={isMobile ? onCloseMobile : onToggleCollapse}
          aria-label={
            isMobile
              ? "Close menu"
              : collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
          }
        >
          {isMobile ? (
            <ChevronLeftIcon fontSize="small" />
          ) : collapsed ? (
            <ChevronRightIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>
      )}
    </div>
  );
}

interface SidebarNavLinkProps {
  to: string;
  icon?: React.ReactNode;
  title: string;
  disabled?: boolean;
  collapsed: boolean;
  onCloseMobile?: () => void;
  pathname: string;
}

const SidebarNavLink = React.memo(function SidebarNavLink({
  to,
  icon,
  title,
  disabled,
  collapsed,
  onCloseMobile,
  pathname,
}: SidebarNavLinkProps) {
  const isActive =
    to === "/"
      ? pathname === to
      : pathname === to || pathname.startsWith(`${to}/`);

  const link = (
    <Link
      to={to}
      className={`sidebar-nav-item${isActive ? " active" : ""}${disabled ? " disabled" : ""}`}
      onMouseEnter={() => prefetchPosRouteForPath(to)}
      onFocus={() => prefetchPosRouteForPath(to)}
      onClick={() => {
        // If we're in temporary drawer mode, parent passes onCloseMobile.
        // Close immediately after navigation so the UI never feels stuck.
        onCloseMobile?.();
      }}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      <span className="sidebar-nav-label">{title}</span>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip title={title} placement="right" arrow>
        <span style={{ display: "block" }}>{link}</span>
      </Tooltip>
    );
  }

  return link;
});

const NestedItem = React.memo(function NestedItem({
  item,
  collapsed,
  onCloseMobile,
  userPermissionObject,
  canPos,
  isAdmin,
  pathname,
}: {
  item: SidebarItem;
  collapsed: boolean;
  onCloseMobile?: () => void;
  userPermissionObject: PermissionKeysObject;
  canPos: (key: Parameters<ReturnType<typeof usePosAccess>["can"]>[0]) => boolean;
  isAdmin: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(item.open ?? false);
  const hasActiveChild = useMemo(() => {
    const matchesPath = (href?: string) =>
      Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));
    const checkNested = (nested?: SidebarItem["nestedItems"]): boolean =>
      nested?.some((n) => matchesPath(n.href) || checkNested(n.nestedItems)) ?? false;
    return checkNested(item.nestedItems);
  }, [item.nestedItems, pathname]);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const isAllItemsHidden = useMemo(() => {
    const check = (nested: SidebarItem["nestedItems"]) =>
      nested?.every((n) => {
        if (n.nestedItems) return check(n.nestedItems);
        if (n?.posKey && !isAdmin && !canPos(n.posKey as Parameters<typeof canPos>[0])) {
          return true;
        }
        return n?.accessKey && !userPermissionObject[n.accessKey];
      }) ?? true;
    return check(item.nestedItems);
  }, [item.nestedItems, userPermissionObject, canPos, isAdmin]);

  if (isAllItemsHidden) return null;

  const toggle = (
    <button
      type="button"
      className="sidebar-nested-toggle"
      onClick={() => setOpen((o) => !o)}
      disabled={item.disabled}
    >
      <span className="sidebar-nav-icon">{item.icon}</span>
      <span className="sidebar-nav-label">{item.title}</span>
      <span className="sidebar-chevron">
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </span>
    </button>
  );

  return (
    <div>
      {collapsed ? (
        <Tooltip title={item.title} placement="right">
          {toggle}
        </Tooltip>
      ) : (
        toggle
      )}
      <Collapse in={open && !collapsed} unmountOnExit>
        <div className="sidebar-nested-children">
          <List disablePadding>
            {item.nestedItems?.map((nested) => {
              if (nested?.posKey && !isAdmin && !canPos(nested.posKey as Parameters<typeof canPos>[0])) {
                return null;
              }
              if (nested?.accessKey && !userPermissionObject[nested.accessKey]) {
                return null;
              }
              if (nested.nestedItems) {
                return (
                  <NestedItem
                    key={nested.accessKey ?? nested.href}
                    item={nested as SidebarItem}
                    collapsed={collapsed}
                    onCloseMobile={onCloseMobile}
                    userPermissionObject={userPermissionObject}
                    canPos={canPos}
                    isAdmin={isAdmin}
                    pathname={pathname}
                  />
                );
              }
              return (
                <SidebarNavLink
                  key={nested.accessKey ?? nested.href}
                  to={nested.href}
                  icon={nested.icon}
                  title={nested.title}
                  disabled={nested.disabled}
                  collapsed={collapsed}
                  onCloseMobile={onCloseMobile}
                  pathname={pathname}
                />
              );
            })}
          </List>
        </div>
      </Collapse>
    </div>
  );
});
