import {
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import {
  updateUser,
  User,
} from "../../api/userApi";
import queryClient from "../../state/queryClient";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: User;
};

export default function UpdateUserProfile({
  open,
  handleClose,
  defaultValues,
}: DialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { isTablet } = useIsMobile();

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    register,
    setValue,
  } = useForm<User>({
    defaultValues: {
      ...defaultValues,
    },
  });

  const { mutate: profileUpdateMutation, isPending } = useMutation({
    mutationFn: (data: Partial<User> & { id: number }) => updateUser(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      enqueueSnackbar("Profile updated successfully!", { variant: "success" });
      handleClose();
    },
    onError: () => {
      enqueueSnackbar("Profile update failed", { variant: "error" });
    },
  });

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

  const onSubmitForm = (data: User) => {
    profileUpdateMutation({
      id: data.id!,
      name: data.name!,
      city: data.city,
      phone: data.phone,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        handleClose();
      }}
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
          Update User Profile
        </Typography>
        <IconButton
          onClick={handleClose}
          edge="start"
          sx={{ color: "#024271" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack direction="column" gap={1}>
          <Box sx={{ display: "flex" }}>
            <TextField
              id="name"
              type="text"
              label="Full Name"
              required
              error={!!errors.name}
              helperText={errors.name ? "Required *" : ""}
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("name", { required: true })}
            />
          </Box>

          <Box sx={{ display: "flex" }}>
            <TextField
              id="phone"
              type="text"
              label="Phone Number"
              error={!!errors.phone}
              helperText={errors.phone ? "Required *" : ""}
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("phone")}
            />
          </Box>

          <Box sx={{ display: "flex" }}>
            <TextField
              id="city"
              type="text"
              label="City"
              error={!!errors.city}
              helperText={errors.city ? "Required *" : ""}
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("city")}
            />
          </Box>
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
          sx={{ backgroundColor: "var(--pallet-blue)" }}
          disabled={isPending}
          size="medium"
          onClick={handleSubmit(onSubmitForm)}
        >
          {defaultValues ? "Update Changes" : "Assign Role"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
