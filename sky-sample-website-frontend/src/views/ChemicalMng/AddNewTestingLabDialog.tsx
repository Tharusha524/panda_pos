import {
  Dialog,
  DialogTitle,
  Typography,
  IconButton,
  Divider,
  DialogContent,
  Stack,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import useIsMobile from "../../customHooks/useIsMobile";
import queryClient from "../../state/queryClient";
import CustomButton from "../../components/CustomButton";
import { createTestLab } from "../../api/ChemicalManagement/ChemicalRequestApi";

export const AddNewTestingLabDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { register, handleSubmit } = useForm();
  const { isMobile } = useIsMobile();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate: createTestingLabMutation, isPending } = useMutation({
    mutationFn: createTestLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testing-labs"] });
      enqueueSnackbar("Testing Lab Created Successfully!", {
        variant: "success",
      });
      setOpen(false);
    },
    onError: () => {
      enqueueSnackbar(`Testing Lab Create Failed`, {
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
          Add New Testing Lab
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
        <Stack
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TextField
            {...register("laboratoryName", { required: true })}
            required
            id="laboratoryName"
            label="Testing Lab"
            size="small"
            fullWidth
            sx={{ marginBottom: "0.5rem" }}
          />
        </Stack>
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
          disabled={isPending}
          endIcon={isPending ? <CircularProgress size={20} /> : null}
          onClick={handleSubmit((data) => createTestingLabMutation(data))}
        >
          Add Lab
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export const AddNewTestingLabButton = (props) => (
  <li
    {...props}
    variant="contained"
    style={{
      backgroundColor: "var(--pallet-lighter-blue)",
      color: "var(--pallet-blue)",
      textTransform: "none",
      margin: "0.5rem",
      borderRadius: "0.3rem",
      display: "flex",
      flexDirection: "row",
    }}
    size="small"
    // onClick closes the menu
    onMouseDown={() => {
      props.onMouseDown();
    }}
  >
    <AddIcon />
    <Typography variant="body2" component="div">
      Add a new testing lab
    </Typography>
  </li>
);
