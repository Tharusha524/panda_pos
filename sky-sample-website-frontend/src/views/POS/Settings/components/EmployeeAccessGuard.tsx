import React from "react";
import { Alert, Box, Button } from "@mui/material";
import { Link } from "react-router";
import usePosAccess from "../../../../hooks/usePosAccess";

interface EmployeeAccessGuardProps {
  children: React.ReactNode;
}

/** Only admin / users.view role can manage employee accounts */
const EmployeeAccessGuard: React.FC<EmployeeAccessGuardProps> = ({ children }) => {
  const { canManageUsers, status } = usePosAccess();

  if (status === "loading" || status === "pending") {
    return null;
  }

  if (!canManageUsers) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You do not have permission to manage employee users. Ask your administrator to grant{" "}
          <strong>Manage employee logins</strong> on your role, or use an Administrator account.
        </Alert>
        <Button component={Link} to="/settings" sx={{ mt: 2 }}>
          Back to Settings
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default EmployeeAccessGuard;
