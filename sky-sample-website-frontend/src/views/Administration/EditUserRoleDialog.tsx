import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Autocomplete,
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect, useState } from "react";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import {
  fetchAllAssigneeLevel,
  updateUserType,
  User,
  UserLevel,
  UserRole,
} from "../../api/userApi";
import { getAccessRolesList } from "../../api/accessManagementApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import queryClient from "../../state/queryClient";
import { useSnackbar } from "notistack";
import { fetchDepartmentData } from "../../api/departmentApi";
import { fetchJobPositionData } from "../../api/jobPositionApi";
import { fetchFactoryData } from "../../api/factoryApi";
import { fetchResponsibleSectionData } from "../../api/responsibleSetionApi";
import AutoCheckBox from "../../components/AutoCheckbox";
import SwitchButton from "../../components/SwitchButton";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: User;
  onSubmit: (data: {
    id: number;
    userTypeId: number;
    assigneeLevel: string;
    department: string;
    availability: boolean;
    jobPosition: string;
    assignedFactory: string[];
    responsibleSection: string[];
  }) => void;
  isSubmitting?: boolean;
};

export default function EditUserRoleDialog({
  open,
  handleClose,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: DialogProps) {
  const { isTablet } = useIsMobile();
  const { data: roles, isFetching: isFetchingRoles } = useQuery<UserRole[]>({
    queryKey: ["access-roles"],
    queryFn: getAccessRolesList,
  });
  const { data: levels, isFetching: isFetchingLevels } = useQuery<UserLevel[]>({
    queryKey: ["access-levels"],
    queryFn: fetchAllAssigneeLevel,
  });
  const { data: departmentData, isFetching: isDepartmentDataFetching } =
    useQuery({
      queryKey: ["departments"],
      queryFn: fetchDepartmentData,
    });
  const { data: jobPositions, isFetched: isJobPositionsFetched } = useQuery({
    queryKey: ["jobPositions"],
    queryFn: fetchJobPositionData,
  });
  const { data: factories, isFetched: isFactoryFetched } = useQuery({
    queryKey: ["factories"],
    queryFn: fetchFactoryData,
  });
  const { data: sections, isFetched: isSectionsFetched } = useQuery({
    queryKey: ["sections"],
    queryFn: fetchResponsibleSectionData,
  });
  const { enqueueSnackbar } = useSnackbar();

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<User>({
    defaultValues: {
      userType: defaultValues?.userType,
      userLevel: defaultValues?.userLevel,
      assignedFactory: defaultValues?.assignedFactory || [],
      ...defaultValues,
    },
  });

  const [selectedFactories, setSelectedFactories] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const isAvailability = watch("availability");

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    } else {
      reset();
    }
  }, [defaultValues, reset]);

  const resetForm = () => {
    reset();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        handleClose();
      }}
      fullScreen={true}
      PaperProps={{
        style: {
          backgroundColor: grey[50],
          minWidth: "500px",
        },
        component: "form",
      }}
    >
      <DialogTitle
        sx={{
          paddingY: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div">
          {defaultValues ? "Edit User Role" : "Add User Role"}
        </Typography>
        <IconButton
          aria-label="open drawer"
          onClick={handleClose}
          edge="start"
          sx={{
            color: "#024271",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack direction="column" gap={1}>
          <Box>
            <Controller
              control={control}
              name={"availability"}
              render={({ field }) => {
                return (
                  <SwitchButton
                    label="Is User Available"
                    onChange={field.onChange}
                    value={field.value}
                  />
                );
              }}
            />
          </Box>

          {isAvailability ? (
            <>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="userType"
                  control={control}
                  defaultValue={defaultValues?.userType}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      value={(field.value as UserRole | null) ?? null}
                      onChange={(_, data) => field.onChange(data)}
                      getOptionLabel={(option) =>
                        typeof option === "object" && option?.userType
                          ? option.userType
                          : ""
                      }
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                      size="small"
                      options={roles || []}
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {option.userType}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.userType}
                          label="Role"
                          name="userType"
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="userLevel"
                  control={control}
                  defaultValue={defaultValues?.userLevel}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      onChange={(_, data) => field.onChange(data)}
                      getOptionLabel={(option) => option?.levelName || ""}
                      size="small"
                      options={levels || []}
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {option.levelName}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.userLevel}
                          label="User Level"
                          name="userLevel"
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="department"
                  control={control}
                  defaultValue={defaultValues?.department ?? ""}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      onChange={(event, newValue) => field.onChange(newValue)}
                      size="small"
                      options={
                        departmentData?.length
                          ? departmentData.map(
                              (department) => department.department
                            )
                          : []
                      }
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.department}
                          helperText={errors.department && "Required"}
                          label="Department"
                          name="department"
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Controller
                  name="jobPosition"
                  control={control}
                  defaultValue={defaultValues?.jobPosition ?? ""}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      onChange={(event, newValue) => field.onChange(newValue)}
                      size="small"
                      options={
                        jobPositions?.length
                          ? jobPositions.map(
                              (jobPositions) => jobPositions.jobPosition
                            )
                          : []
                      }
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.jobPosition}
                          helperText={errors.jobPosition && "Required"}
                          label="Job Position"
                          name="jobPosition"
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1, margin: 1 }}>
                <AutoCheckBox
                  control={control}
                  required={true}
                  name="assignedFactory"
                  label="Select Factories"
                  options={factories}
                  selectedValues={selectedFactories}
                  setSelectedValues={setSelectedFactories}
                  getOptionLabel={(option) => option.factoryName}
                  getOptionValue={(option) => option.factoryName}
                  placeholder="Choose Factories"
                  limitTags={2}
                />
              </Box>

              <Box sx={{ flex: 1, margin: 1 }}>
                <AutoCheckBox
                  control={control}
                  required={true}
                  name="responsibleSection"
                  label="Select Responsible Sections"
                  options={sections}
                  selectedValues={selectedSections}
                  setSelectedValues={setSelectedSections}
                  getOptionLabel={(option) => option.sectionName}
                  getOptionValue={(option) => option.sectionName}
                  placeholder="Select Sections"
                  limitTags={2}
                />
              </Box>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button
          onClick={() => {
            resetForm();
            handleClose();
          }}
          sx={{ color: "var(--pallet-blue)" }}
        >
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          sx={{
            backgroundColor: "var(--pallet-blue)",
          }}
          disabled={isSubmitting}
          size="medium"
          onClick={handleSubmit((data) => {
            onSubmit({
              id: defaultValues?.id,
              userTypeId: data.userType?.id,
              assigneeLevel: data.userLevel?.id != null ? String(data.userLevel.id) : undefined,
              department: data.department,
              availability: data.availability,
              jobPosition: data.jobPosition,
              assignedFactory: data.assignedFactory,
              responsibleSection: data.responsibleSection,
            });
          })}
        >
          {defaultValues ? "Update Changes" : "Assign Role"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
