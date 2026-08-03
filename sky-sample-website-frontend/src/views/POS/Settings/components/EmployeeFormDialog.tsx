import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import type { Employee } from "../../../../api/Settings/employeeApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";

interface EmployeeFormDialogProps {
  open: boolean;
  employee: Employee | null;
  showEmployeeCodeField: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    address: string;
    monthly_salary: number;
    employee_code?: string;
  }) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  open,
  employee,
  showEmployeeCodeField,
  onClose,
  onSubmit,
  onDelete,
  isSaving = false,
  isDeleting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      employee_code: "",
      monthly_salary: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: employee?.name ?? "",
        phone: employee?.phone ?? "",
        address: employee?.address ?? "",
        employee_code: employee?.employee_code ?? "",
        monthly_salary: employee?.monthly_salary ?? 0,
      });
    }
  }, [open, employee, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={POS_DIALOG_PAPER_SX}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        {employee ? "Edit Employee" : "Add Employee"}
      </DialogTitle>
      <form
        onSubmit={handleSubmit((data) =>
          onSubmit({
            name: data.name,
            phone: data.phone,
            address: data.address,
            employee_code: showEmployeeCodeField ? data.employee_code : undefined,
            monthly_salary: parseFloat(String(data.monthly_salary)) || 0,
          })
        )}
      >
        <DialogContent sx={{ pt: 1, px: 3, pb: 2 }}>
          {showEmployeeCodeField && (
            <TextField
              fullWidth
              label="Employee ID"
              margin="dense"
              {...register("employee_code")}
            />
          )}
          <TextField
            fullWidth
            label="Name"
            margin="dense"
            required
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <TextField
            fullWidth
            label="Phone No"
            margin="dense"
            {...register("phone")}
          />
          <TextField
            fullWidth
            label="Address"
            margin="dense"
            multiline
            rows={2}
            {...register("address")}
          />
          <TextField
            fullWidth
            label="Monthly salary (Rs)"
            margin="dense"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            helperText="Saved salary is posted automatically to the Payment Dashboard for this month"
            {...register("monthly_salary", { valueAsNumber: true })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>
            {onDelete && (
              <Button
                color="error"
                onClick={onDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </Box>
          <Box>
            <Button onClick={onClose} disabled={isSaving || isDeleting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || isDeleting}
              sx={{ ...POS_PRIMARY_BUTTON_SX, ml: 1, textTransform: "none", minWidth: 100 }}
            >
              {isSaving ? "Saving…" : employee ? "Update" : "Add"}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployeeFormDialog;
