import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import groupLogo from "../../assets/group-logo.png";
import { useForm } from "react-hook-form";
import CustomButton from "../../components/CustomButton";
import LoginIcon from "@mui/icons-material/Login";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../../api/userApi";
import { BACKEND_CONFIGURE_PATH } from "../../config/appPaths";
import { getApiBaseUrl } from "../../config/apiBase";
import usePublicBranding from "../../hooks/usePublicBranding";

function LoginForm() {
  const { logoUrl } = usePublicBranding();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [openForgotPasswordDialog, setOpenForgotPasswordDialog] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "all",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      enqueueSnackbar("Welcome Back!", { variant: "success" });
      const serverUser = data?.data?.user ?? data?.data ?? null;
      if (serverUser) {
        queryClient.setQueryData(["current-user"], serverUser);
      }
      const subscription = data?.data?.subscription;
      if (subscription) {
        queryClient.setQueryData(["subscription-status"], subscription);
      }
      const canAccess = subscription?.can_access !== false;
      navigate(
        canAccess ? "/dashboard" : "/settings/subscription/manage",
        { replace: true }
      );
    },
    onError: (err: { friendlyMessage?: string; data?: { message?: string } }) => {
      const message =
        err?.friendlyMessage ||
        err?.data?.message ||
        "Invalid email or password. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const onLoginSubmit = (data: { email: string; password: string }) => {
    loginMutation(data);
  };

  return (
    <Stack
      spacing={2}
      sx={{
        height: isMdUp ? "100vh" : "auto",
        justifyContent: "center",
        margin: "2.5rem",
        marginBottom: isMdUp ? "2.5rem" : "22vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignSelf: "flex-start",
          width: "fit-content",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
          borderRadius: 2,
          bgcolor: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        <img
          src={logoUrl}
          alt="logo"
          style={{ display: "block", height: 56, maxWidth: 220, objectFit: "contain" }}
        />
      </Box>
      <Box>
        <Typography variant={"body2"}>
          Sign in with your email and password.
          <br /> Don't have an account?{" "}
          <span
            style={{ color: "var(--pallet-blue)", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Sign Up Here
          </span>
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Server: {getApiBaseUrl()}{" "}
          <span
            style={{ color: "var(--pallet-orange)", cursor: "pointer" }}
            onClick={() => navigate(BACKEND_CONFIGURE_PATH)}
          >
            Change
          </span>
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(onLoginSubmit)}>
        <TextField
          required
          id="email"
          label="Email Address"
          placeholder="sample@company.com"
          error={!!errors.email}
          fullWidth
          type="email"
          size="small"
          sx={{ marginTop: "0.5rem" }}
          {...register("email", {
            required: {
              value: true,
              message: "Email is required",
            },
            minLength: {
              value: 5,
              message: "Email must be at least 5 characters long",
            },
            maxLength: {
              value: 320,
              message: "Email cannot exceed 320 characters long",
            },
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Invalid email format",
            },
          })}
          helperText={errors.email ? errors.email.message : ""}
        />

        <TextField
          required
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          size="small"
          fullWidth
          sx={{ marginTop: "1rem" }}
          error={!!errors.password}
          {...register("password", {
            required: {
              value: true,
              message: "Password is required",
            },
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters long",
            },
            maxLength: {
              value: 128,
              message: "Password cannot exceed 128 characters long",
            },
          })}
          helperText={errors.password ? errors.password.message : ""}
        />

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                size="small"
              />
            }
            label="Show Password"
            sx={{
              "& .MuiTypography-body1": {
                fontSize: "0.85rem",
              },
              marginTop: "0.5rem",
            }}
          />
        </Box>

        <Box
          sx={{
            marginTop: "1.6rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <CustomButton
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "var(--pallet-blue)",
            }}
            size="medium"
            disabled={isPending}
            startIcon={
              isPending ? (
                <CircularProgress color="inherit" size={"1rem"} />
              ) : (
                <LoginIcon />
              )
            }
          >
            Log In
          </CustomButton>
          <CustomButton
            variant="text"
            sx={{
              color: "var(--pallet-orange)",
            }}
            size="medium"
            onClick={() => setOpenForgotPasswordDialog(true)}
          >
            Forgot Password
          </CustomButton>
        </Box>
      </form>
      <ForgotPasswordDialog
        open={openForgotPasswordDialog}
        handleClose={() => setOpenForgotPasswordDialog(false)}
      />
    </Stack>
  );
}

export default LoginForm;
