import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import EmployeeFormDialog from "../components/EmployeeFormDialog";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
  type Employee,
  type EmployeePayload,
} from "../../../../api/Settings/employeeApi";
import {
  getEmployeeSettings,
  updateEmployeeSettings,
} from "../../../../api/Settings/employeeSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";

const EmployeeSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const [allowAutoNumber, setAllowAutoNumber] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["employee-settings"],
    queryFn: getEmployeeSettings,
  });

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  useEffect(() => {
    if (settings) {
      setAllowAutoNumber(settings.allow_employee_auto_number);
    }
  }, [settings]);

  const settingsMutation = useMutation({
    mutationFn: updateEmployeeSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["employee-settings"], updated);
      setAllowAutoNumber(updated.allow_employee_auto_number);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to save employee setting"));
    },
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setMessage("Employee added successfully!");
      setError(null);
      setDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to add employee"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmployeePayload }) =>
      updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setMessage("Employee updated successfully!");
      setError(null);
      setDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to update employee"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setMessage("Employee deleted successfully!");
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to delete employee"));
    },
  });

  const handleToggleAutoNumber = (checked: boolean) => {
    setAllowAutoNumber(checked);
    settingsMutation.mutate({ allow_employee_auto_number: checked });
  };

  const handleOpenAdd = () => {
    setSelectedEmployee(null);
    setDialogOpen(true);
  };

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleFormSubmit = (data: {
    name: string;
    phone: string;
    address: string;
    monthly_salary: number;
    employee_code?: string;
  }) => {
    const payload: EmployeePayload = {
      name: data.name,
      phone: data.phone || undefined,
      address: data.address || undefined,
      monthly_salary: data.monthly_salary,
      employee_code: data.employee_code || undefined,
    };
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = settingsLoading || employeesLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <SettingsPageShell
        title="Employee"
        subtitle="Manage your employees"
        wide
        hideSave
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell
        title="Employee"
        subtitle="Manage your employees"
        wide
        hideSave
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(fetchError, "Failed to load employees")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Employee"
      subtitle="Manage your employees"
      wide
      hideSave
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, textAlign: "center" }}>
          Manage your Employee
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => refetch()}
              sx={{ color: "var(--pallet-blue)" }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add employee">
            <IconButton
              onClick={handleOpenAdd}
              sx={{
                color: "#fff",
                bgcolor: "var(--pallet-blue)",
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SettingsToggleRow
        title="Allow Employee"
        description="Auto Number is a unique code assigned internally to an employee"
        checked={allowAutoNumber}
        onChange={handleToggleAutoNumber}
        disabled={settingsMutation.isPending}
      />

      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: "0 0 8px rgba(0,0,0,0.08)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No employees yet. Click + to add one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell>{row.display_id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phone || "—"}</TableCell>
                  <TableCell>{row.address || ""}</TableCell>
                  <TableCell>
                    <ChevronRightIcon color="action" fontSize="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <EmployeeFormDialog
        open={dialogOpen}
        employee={selectedEmployee}
        showEmployeeCodeField={!allowAutoNumber}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={
          selectedEmployee
            ? () => {
                const employee = selectedEmployee;
                deleteConfirm.requestDelete({
                  title: "Delete employee",
                  message: `Delete employee "${employee.name}"? This cannot be undone.`,
                  onConfirm: () => {
                    deleteMutation.mutate(employee.id, {
                      onSuccess: () => {
                        setDialogOpen(false);
                        setSelectedEmployee(null);
                      },
                    });
                  },
                });
              }
            : undefined
        }
        isSaving={isSaving}
        isDeleting={deleteMutation.isPending}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default EmployeeSettings;
