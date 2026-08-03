import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSnackbar } from "notistack";
import { getStoredToken } from "../../api/userApi";
import {
  getSystemAlerts,
  type SystemAlert,
  type SystemAlertSeverity,
} from "../../api/systemAlertsApi";

const TOAST_SESSION_KEY = "pos-system-alerts-toast-shown";
const REFETCH_MS = 5 * 60 * 1000;

function severityIcon(severity: SystemAlertSeverity) {
  switch (severity) {
    case "error":
      return <ErrorOutlineIcon fontSize="small" color="error" />;
    case "warning":
      return <WarningAmberIcon fontSize="small" color="warning" />;
    default:
      return <InfoOutlinedIcon fontSize="small" color="info" />;
  }
}

function badgeColor(severity: SystemAlertSeverity | undefined): "error" | "warning" | "info" {
  if (severity === "error") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const hasToken = !!getStoredToken();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: getSystemAlerts,
    enabled: hasToken,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  const alerts = data?.alerts ?? [];
  const totalCount = data?.total_count ?? 0;
  const topSeverity = alerts.find((a) => a.severity === "error")?.severity
    ?? alerts.find((a) => a.severity === "warning")?.severity
    ?? alerts[0]?.severity;

  useEffect(() => {
    if (!data || !hasToken) return;
    const expired = data.summary.expired_count ?? 0;
    if (expired <= 0) return;
    if (sessionStorage.getItem(TOAST_SESSION_KEY)) return;

    sessionStorage.setItem(TOAST_SESSION_KEY, "1");
    enqueueSnackbar(
      expired === 1
        ? "1 item has expired stock — check notifications."
        : `${expired} items have expired stock — check notifications.`,
      { variant: "error", autoHideDuration: 6000 }
    );
  }, [data, hasToken, enqueueSnackbar]);

  if (!hasToken) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    refetch();
  };

  const handleClose = () => setAnchorEl(null);

  const handleAlertClick = (alert: SystemAlert) => {
    handleClose();
    navigate(alert.link);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Alerts & notifications">
        <IconButton
          aria-label="Alerts and notifications"
          onClick={handleOpen}
          sx={{ color: "var(--pallet-blue)" }}
        >
          <Badge
            badgeContent={totalCount}
            color={badgeColor(topSeverity)}
            max={99}
            invisible={totalCount === 0}
          >
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 360, maxWidth: "95vw", mt: 1 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Alerts
          </Typography>
          {(isLoading || isFetching) && <CircularProgress size={16} />}
        </Box>
        <Divider />

        {isLoading && !data ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No alerts right now. Stock and expiry notices will appear here.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflow: "auto" }}>
            {alerts.map((alert) => (
              <ListItemButton key={alert.id} onClick={() => handleAlertClick(alert)} alignItems="flex-start">
                <Box sx={{ mr: 1.5, mt: 0.5 }}>{severityIcon(alert.severity)}</Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {alert.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.count}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" component="span" display="block">
                        {alert.message}
                      </Typography>
                      {alert.items.slice(0, 3).map((item) => (
                        <Typography
                          key={item.id}
                          variant="caption"
                          color="text.secondary"
                          component="div"
                          sx={{ mt: 0.25 }}
                          noWrap
                        >
                          {item.item_number} · {item.description}
                          {item.nearest_expiry_date ? ` · ${item.nearest_expiry_date}` : ""}
                        </Typography>
                      ))}
                      {alert.items.length > 3 && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          +{alert.items.length - 3} more…
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Button
            size="small"
            onClick={() => {
              handleClose();
              navigate("/settings/company/notifications");
            }}
          >
            Company alerts
          </Button>
          <Button
            size="small"
            onClick={() => {
              handleClose();
              navigate("/settings/alert");
            }}
          >
            My alerts
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
