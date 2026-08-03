import React, { useState } from "react";
import {
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import { getLoginHistory } from "../../../../api/userApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { isAuthenticated } from "../../../../utils/authSession";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";

const LoginHistorySettings: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const authed = isAuthenticated();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["login-history", page, rowsPerPage],
    queryFn: () => getLoginHistory({ page: page + 1, per_page: rowsPerPage }),
    enabled: authed,
    retry: 1,
  });

  const logs = data?.logs ?? [];
  const total = data?.pagination?.total ?? 0;

  return (
    <SettingsPageShell
      title="Login History"
      subtitle="Email sign-ins with IP address and device info"
      wide
      hideSave
      backTo={USER_SETTINGS_BASE}
      backLabel="User Settings"
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        Every successful login is recorded with the user email and IP address. Use{" "}
        <strong>Log out</strong> when you finish — do not share your login on a shared computer.
      </Alert>

      {!authed ? (
        <Alert severity="warning">Please sign in to view login history.</Alert>
      ) : null}

      {isError ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Typography
              component="button"
              onClick={() => refetch()}
              sx={{
                border: 0,
                background: "none",
                cursor: "pointer",
                color: "inherit",
                textDecoration: "underline",
                fontSize: "inherit",
              }}
            >
              Retry
            </Typography>
          }
        >
          {getFriendlyErrorMessage(error, "Failed to load login history")}
        </Alert>
      ) : null}

      {authed && isLoading ? (
        <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
      ) : null}

      {authed && !isLoading && !isError ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {data?.can_view_all
              ? "Showing logins for all users in your company."
              : "Showing your login history only."}
            {isFetching && !isLoading ? " (updating…)" : ""}
          </Typography>
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date & time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Device / browser</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No login records yet. Sign out and sign in again — your next login will appear
                      here with IP address.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.logged_at ?? "—"}</TableCell>
                      <TableCell>{row.user_name ?? "—"}</TableCell>
                      <TableCell>{row.user_email ?? "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {row.ip_address ?? "—"}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 280,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={row.user_agent ?? undefined}
                      >
                        {row.user_agent ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {total > 0 ? (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          ) : null}
        </>
      ) : null}
    </SettingsPageShell>
  );
};

export default LoginHistorySettings;
