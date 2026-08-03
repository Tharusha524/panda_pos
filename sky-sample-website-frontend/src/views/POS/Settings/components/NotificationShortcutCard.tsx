import React from "react";
import { Link } from "react-router";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

interface NotificationShortcutCardProps {
  title: string;
  description: string;
  to: string;
  icon: SvgIconComponent;
  actionLabel: string;
}

const NotificationShortcutCard: React.FC<NotificationShortcutCardProps> = ({
  title,
  description,
  to,
  icon: Icon,
  actionLabel,
}) => (
  <Card
    elevation={0}
    sx={{
      mb: 2,
      backgroundColor: "var(--surface-bg)",
      boxShadow: "0 0 10px rgba(0,0,0,0.08)",
      borderRadius: "0.3rem",
      border: "1px solid var(--surface-border)",
      transition: "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: "var(--pallet-blue)",
        boxShadow: "0 4px 16px rgba(0, 50, 126, 0.12)",
      },
    }}
  >
    <CardActionArea
      component={Link}
      to={to}
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "left",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <Box sx={{ flex: 1, pr: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            color: "success.main",
            typography: "body2",
            fontWeight: 600,
          }}
        >
          {actionLabel}
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </Box>
      </Box>
      <Box
        sx={{
          width: 100,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--pallet-blue)",
          opacity: 0.85,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <NotificationsActiveIcon sx={{ fontSize: 48, opacity: 0.3 }} />
          <Icon sx={{ fontSize: 32, position: "absolute", top: 20, left: 8 }} />
        </Box>
      </Box>
    </CardActionArea>
  </Card>
);

export default NotificationShortcutCard;
