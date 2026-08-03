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
import useIsMobile from "../../customHooks/useIsMobile";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import CustomButton from "../../components/CustomButton";
import AddIcon from "@mui/icons-material/Add";
import UserAutoComplete from "../../components/UserAutoComplete";
import AutoCheckBox from "../../components/AutoCheckbox";
import { Component, demoData } from "../../api/componentApi";
import { useState } from "react";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";

export default function AddOrEditHazardRiskDialog({
  defaultValues: defaultValues,
}) {
  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Text Fields" },
  ];
  const { isMobile, isTablet } = useIsMobile();
  const [selectedDemo, setSelectedDemo] = useState([]);
  const [addNewContactDialogOpen, setAddNewContactDialogOpen] = useState(false);
  const {
    register,
    control,
    formState: { errors },
  } = useForm<Component>({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const AddNewObservationButton = (props) => (
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
      onMouseDown={() => {
        setAddNewContactDialogOpen(true);
      }}
    >
      <AddIcon />
      <Typography variant="body2" component="div">
        Add New Demo
      </Typography>
    </li>
  );

  const AddNewObservationTypeDialog = ({
    demo1,
    demo2,
  }: {
    demo1: string;
    demo2: string;
  }) => {
    const { register, handleSubmit } = useForm({});

    const handleCreateObservationType = (data: { observation: string }) => {
      console.log("Creating Demo type", data, demo2, demo1);
    };

    return (
      <Dialog
        open={addNewContactDialogOpen}
        onClose={() => setAddNewContactDialogOpen(false)}
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
            Add New Demo
          </Typography>
          <IconButton
            aria-label="open drawer"
            onClick={() => setAddNewContactDialogOpen(false)}
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
              {...register("demo", { required: true })}
              required
              id="demo"
              label="Demo"
              size="small"
              fullWidth
              sx={{ marginBottom: "0.5rem" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: "1rem" }}>
          <Button
            onClick={() => setAddNewContactDialogOpen(false)}
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
            onClick={handleSubmit(handleCreateObservationType)}
          >
            Add Demo
          </CustomButton>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          overflowX: "hidden",
        }}
      >
        <PageTitle title="Input Fields" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
      <AddNewObservationTypeDialog demo1={null} demo2={null} />
      <Stack
        sx={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          padding: "1rem",
        }}
      >
        <Stack
          gap={3}
          sx={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--surface-bg)",
            flex: { lg: 3, md: 1 },
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "0.5rem",
            borderRadius: "0.3rem",
          }}
        >
          <Box>
            <Typography>Normal Text Field</Typography>
            <Box
              mt={1}
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <TextField
                {...register("name", { required: true })}
                required
                id="name"
                label="Demo"
                size="small"
                fullWidth
                sx={{ marginBottom: "0.5rem" }}
              />
            </Box>
          </Box>
        </Stack>
      </Stack>
    </>
  );
}
