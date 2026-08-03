import React from "react";
import { Link } from "react-router";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface CompanyShortcutCardProps {
  title: string;
  description: string;
  to: string;
  icon: SvgIconComponent;
  actionLabel: string;
}

const CompanyShortcutCard: React.FC<CompanyShortcutCardProps> = ({
  title,
  description,
  to,
  icon: Icon,
  actionLabel,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        backgroundColor: "var(--surface-bg)",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        borderRadius: "0.3rem",
        border: "1px solid var(--pallet-border-blue)",
        transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
        "&:hover": {
          borderColor: "var(--pallet-blue)",
          boxShadow: "0 4px 16px rgba(0, 50, 126, 0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={to}
        sx={{
          height: "100%",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "left",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "0.3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 50, 126, 0.1)",
            mb: 1.5,
          }}
        >
          <Icon sx={{ fontSize: 28, color: "var(--pallet-blue)" }} />
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "var(--pallet-text-primary)", mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--pallet-text-secondary)",
            flexGrow: 1,
            mb: 1,
          }}
        >
          {description}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "var(--pallet-blue)",
            typography: "caption",
            fontWeight: 600,
          }}
        >
          {actionLabel}
          <ChevronRightIcon sx={{ fontSize: 18, ml: 0.25 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default CompanyShortcutCard;
