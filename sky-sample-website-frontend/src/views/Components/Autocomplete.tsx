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
    { title: "AutoComplete" },
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
            <Typography>Normal AutoComplete</Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Autocomplete
                {...register("name", { required: true })}
                size="small"
                options={
                  demoData?.length ? demoData.map((demo) => demo.name) : []
                }
                defaultValue={defaultValues?.name}
                sx={{ flex: 1, margin: "0.5rem" }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    error={!!errors.name}
                    helperText={errors.name ? "Required" : ""}
                    label="Demo"
                    name="demo"
                  />
                )}
              />
            </Box>
          </Box>
          <Box>
            <Typography>AutoComplete Return the ID</Typography>
            <Box>
              <UserAutoComplete
                name="name"
                label="Demo"
                control={control}
                register={register}
                errors={errors}
                userData={demoData}
                defaultValue={defaultValues?.name}
                required={true}
              />
            </Box>
          </Box>
          <Box sx={{ marginX: "0.5rem" }}>
            <Typography>AutoComplete Checkboxes</Typography>
            <AutoCheckBox
              {...register("name", { required: true })}
              control={control}
              required={true}
              name="name"
              label="Demo"
              options={demoData}
              selectedValues={selectedDemo}
              setSelectedValues={setSelectedDemo}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
              placeholder="Choose Demo"
              limitTags={2}
            />
          </Box>
          <Box>
            <Typography>AutoComplete with Create Option</Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Autocomplete
                {...register("name")}
                size="small"
                noOptionsText={
                  <>
                    <Typography variant="body2" color="inherit" gutterBottom>
                      No matching Items
                    </Typography>
                  </>
                }
                options={[
                  ...(demoData?.length
                    ? demoData.map((demo) => demo.name)
                    : []),
                  "$ADD_NEW_ITEM",
                ]}
                renderOption={(props, option) => (
                  <>
                    {option === "$ADD_NEW_ITEM" ? (
                      <AddNewObservationButton {...props} />
                    ) : (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    )}
                  </>
                )}
                defaultValue={defaultValues?.name}
                sx={{ flex: 1, margin: "0.5rem" }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={!!errors.name}
                    label="Demo"
                    name="name"
                  />
                )}
              />
            </Box>
          </Box>
          <Box>
            <Typography>Controlled AutoComplete</Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Controller
                name="name"
                control={control}
                defaultValue={defaultValues?.name ?? ""}
                {...register("name", { required: true })}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    onChange={(event, newValue) => field.onChange(newValue)}
                    size="small"
                    options={
                      demoData?.length ? demoData.map((demo) => demo.name) : []
                    }
                    sx={{ flex: 1, margin: "0.5rem" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={!!errors.name}
                        helperText={errors.name && "Required"}
                        label="Demo"
                        name="name"
                      />
                    )}
                  />
                )}
              />
            </Box>
          </Box>
        </Stack>
      </Stack>
    </>
  );
}
