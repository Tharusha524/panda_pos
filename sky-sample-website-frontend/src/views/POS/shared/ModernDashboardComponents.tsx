import React from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  alpha,
  type ButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { Link } from "react-router";

/* ─── Layout ─── */

export const dashboardPageSx: SxProps<Theme> = {
  p: { xs: 2, sm: 3 },
  maxWidth: 1400,
  mx: "auto",
  width: "100%",
  boxSizing: "border-box",
};

export const DashboardPage: React.FC<{ children: React.ReactNode; sx?: SxProps<Theme> }> = ({
  children,
  sx,
}) => <Box sx={{ ...dashboardPageSx, ...sx }}>{children}</Box>;

/* ─── Hero ─── */

export interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  isLive?: boolean;
  isFetching?: boolean;
  lastUpdated?: string;
  actions?: React.ReactNode;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  title,
  subtitle,
  gradient = "linear-gradient(135deg, #0f172a 0%, #1e40af 45%, #3b82f6 100%)",
  isLive,
  isFetching,
  lastUpdated,
  actions,
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 3,
      p: { xs: 2.5, sm: 3 },
      borderRadius: 4,
      background: gradient,
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: -80,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: "50%",
        bgcolor: alpha("#fff", 0.06),
      },
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: -60,
        left: "30%",
        width: 160,
        height: 160,
        borderRadius: "50%",
        bgcolor: alpha("#fff", 0.04),
      },
    }}
  >
    <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ opacity: 0.92, maxWidth: 520 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {isLive ? (
        <Chip
          icon={
            <FiberManualRecordIcon
              sx={{
                fontSize: 10,
                color: isFetching ? "#fbbf24" : "#4ade80",
                animation: isFetching ? "pulse 1.2s infinite" : "none",
                "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
              }}
            />
          }
          label={`Live · ${lastUpdated ?? "—"}`}
          size="small"
          sx={{
            bgcolor: alpha("#fff", 0.14),
            color: "#fff",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            "& .MuiChip-icon": { color: "inherit" },
          }}
        />
      ) : null}
      {actions}
    </Box>
  </Paper>
);

export const DashboardHeroButton: React.FC<ButtonProps> = ({ sx, ...props }) => (
  <Button
    variant="contained"
    sx={{
      bgcolor: "var(--surface-bg)",
      color: "var(--surface-text)",
      fontWeight: 700,
      textTransform: "none",
      borderRadius: 2.5,
      px: 2.5,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      "&:hover": { bgcolor: "var(--surface-bg-alt)" },
      ...sx,
    }}
    {...props}
  />
);

/* ─── KPI cards ─── */

export interface ModernKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  to?: string;
  loading?: boolean;
}

export const ModernKpiCard: React.FC<ModernKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent,
  to,
  loading,
}) => {
  const content = (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 3.5,
        border: "1px solid",
        borderColor: alpha(accent, 0.18),
        background: `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, var(--surface-bg) 55%)`,
        boxShadow: `0 4px 24px ${alpha(accent, 0.08)}`,
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        ...(to && {
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: `0 16px 40px ${alpha(accent, 0.16)}`,
          },
        }),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: alpha(accent, 0.85),
              display: "block",
              mb: 0.75,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "var(--surface-text)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {loading ? "—" : value}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(accent, 0.14),
            color: accent,
            boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.12)}`,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );

  if (to) {
    return (
      <Box component={Link} to={to} sx={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
        {content}
      </Box>
    );
  }
  return content;
};

export const KpiGrid: React.FC<{ children: React.ReactNode; columns?: { xs?: number; sm?: number; md?: number; xl?: number } }> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, xl: 5 },
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: `repeat(${columns.xs ?? 1}, 1fr)`,
        sm: `repeat(${columns.sm ?? 2}, 1fr)`,
        md: `repeat(${columns.md ?? 3}, 1fr)`,
        xl: `repeat(${columns.xl ?? 5}, 1fr)`,
      },
      gap: 2.5,
      mb: 3,
    }}
  >
    {children}
  </Box>
);

/* ─── Summary cards (module dashboards) ─── */

export interface ModernSummaryCardProps {
  label: string;
  description?: string;
  value: string | number;
  accent: string;
  icon?: React.ReactNode;
  loading?: boolean;
  highlight?: boolean;
}

export const ModernSummaryCard: React.FC<ModernSummaryCardProps> = ({
  label,
  description,
  value,
  accent,
  icon,
  loading,
  highlight,
}) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: { xs: "100%", sm: 200 },
      p: 2.25,
      borderRadius: 3,
      border: "1px solid",
      borderColor: alpha(accent, highlight ? 0.28 : 0.14),
      background: highlight
        ? `linear-gradient(135deg, ${alpha(accent, 0.12)} 0%, var(--surface-bg) 70%)`
        : "var(--surface-bg)",
      boxShadow: highlight ? `0 8px 28px ${alpha(accent, 0.1)}` : "0 2px 12px rgba(15,23,42,0.04)",
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        bgcolor: accent,
        borderRadius: "4px 0 0 4px",
      },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pl: 1 }}>
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: accent }}
        >
          {label}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {description}
          </Typography>
        ) : null}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mt: 1,
            color: highlight ? accent : "var(--surface-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {loading ? "—" : value}
        </Typography>
      </Box>
      {icon ? (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(accent, 0.1),
            color: accent,
          }}
        >
          {icon}
        </Box>
      ) : null}
    </Box>
  </Paper>
);

export const SummaryCardsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>{children}</Box>
);

/* ─── Stat tiles ─── */

export interface ModernStatTileProps {
  label: string;
  value: string | number;
  accent?: string;
  to?: string;
  warning?: boolean;
}

export const ModernStatTile: React.FC<ModernStatTileProps> = ({
  label,
  value,
  accent = "#64748b",
  to,
  warning,
}) => {
  const tile = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        textAlign: "center",
        border: "1px solid",
        borderColor: alpha(warning ? "#f59e0b" : accent, 0.2),
        bgcolor: warning ? alpha("#f59e0b", 0.06) : alpha(accent, 0.04),
        transition: "transform 0.2s",
        ...(to && {
          cursor: "pointer",
          "&:hover": { transform: "scale(1.02)" },
        }),
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{ fontWeight: 800, mt: 0.5, color: warning ? "warning.dark" : "var(--surface-text)" }}
      >
        {value}
      </Typography>
    </Paper>
  );

  if (to) {
    return (
      <Box component={Link} to={to} sx={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {tile}
      </Box>
    );
  }
  return tile;
};

/* ─── Quick links ─── */

export const DashboardQuickLinks: React.FC<{
  links: { label: string; to: string }[];
}> = ({ links }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
    {links.map((link) => (
      <Button
        key={link.to}
        component={Link}
        to={link.to}
        size="small"
        variant="outlined"
        sx={{
          textTransform: "none",
          borderRadius: 99,
          px: 2,
          fontWeight: 600,
          borderColor: alpha("#2563eb", 0.25),
          color: "var(--pallet-blue)",
          bgcolor: alpha("#2563eb", 0.08),
          "&:hover": {
            borderColor: "#2563eb",
            bgcolor: alpha("#2563eb", 0.16),
          },
        }}
      >
        {link.label}
      </Button>
    ))}
  </Box>
);

/* ─── Sections & panels ─── */

export const DashboardSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}> = ({ title, icon, action, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3.5,
      border: "1px solid var(--surface-border)",
      bgcolor: "var(--surface-bg)",
      boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
      height: "100%",
      ...sx,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

export const DashboardFilterPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      mb: 2.5,
      borderRadius: 3,
      border: "1px solid var(--surface-border)",
      bgcolor: "var(--surface-bg-alt)",
      backdropFilter: "blur(8px)",
    }}
  >
    {children}
  </Paper>
);

export const ModernTableContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paper
    elevation={0}
    sx={{
      border: "1px solid var(--surface-border)",
      borderRadius: 3.5,
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
      bgcolor: "var(--surface-bg)",
    }}
  >
    {children}
  </Paper>
);

/* ─── Balance chip ─── */

export const BalanceChip: React.FC<{ amount: number; format?: (n: number) => string }> = ({
  amount,
  format = (n) => n.toLocaleString("en-LK", { minimumFractionDigits: 2 }),
}) => {
  const hasDebt = amount > 0.005;
  const color = hasDebt ? "#dc2626" : amount < -0.005 ? "#059669" : "#64748b";
  return (
    <Chip
      label={`Rs ${format(amount)}`}
      size="small"
      sx={{
        fontWeight: 700,
        bgcolor: alpha(color, 0.1),
        color,
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    />
  );
};

/* ─── Toolbar button ─── */

export const modernHeaderBtnSx = {
  textTransform: "none" as const,
  fontWeight: 600,
  borderRadius: 2.5,
  borderColor: alpha("#64748b", 0.35),
  color: "text.primary",
  bgcolor: "var(--surface-bg)",
  px: 2,
  "&:hover": { bgcolor: "var(--surface-bg-alt)", borderColor: "#94a3b8" },
};

export const modernPrimaryBtnSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  borderRadius: 2.5,
  bgcolor: "var(--pallet-blue)",
  boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
  "&:hover": { bgcolor: "var(--pallet-main-blue)" },
};
