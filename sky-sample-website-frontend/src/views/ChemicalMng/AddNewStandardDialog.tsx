import {
  Dialog,
  DialogTitle,
  Typography,
  IconButton,
  Divider,
  DialogContent,
  Box,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { useForm } from "react-hook-form";
import {
  createProductStandard,
  ProductStandard,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import CloseIcon from "@mui/icons-material/Close";
import queryClient from "../../state/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

export const AddNewStandardDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductStandard>();
  const { isMobile } = useIsMobile();

  const handleCreateProductStandard = (data) => {
    createProductStandardMutation(data);
  };

  const {
    mutate: createProductStandardMutation,
    isPending: isProductStandardCreating,
  } = useMutation({
    mutationFn: createProductStandard,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-standards"],
      });
      enqueueSnackbar("Product Standard Create Successfully!", {
        variant: "success",
      });
      reset();
      setOpen(false);
    },
    onError: () => {
      enqueueSnackbar(`Product Standard Create Failed`, {
        variant: "error",
      });
    },
  });

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        style: {
          backgroundColor: grey[50],
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
          Add New Product Standard
        </Typography>
        <IconButton
          aria-label="open drawer"
          onClick={() => setOpen(false)}
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
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            {...register("productStandard", { required: true })}
            required
            error={!!errors.productStandard}
            helperText={errors.productStandard ? "Name is required" : ""}
            id="productStandard	"
            label="Name"
            size="small"
            fullWidth
            sx={{ margin: "0.5rem", flex: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "1rem" }}>
        <Button
          onClick={() => setOpen(false)}
          sx={{ color: "var(--pallet-blue)" }}
        >
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          sx={{
            backgroundColor: "var(--pallet-blue)",
          }}
          size="medium"
          disabled={isProductStandardCreating}
          endIcon={
            isProductStandardCreating ? <CircularProgress size={20} /> : null
          }
          onClick={handleSubmit(handleCreateProductStandard)}
        >
          Add Standard
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};
