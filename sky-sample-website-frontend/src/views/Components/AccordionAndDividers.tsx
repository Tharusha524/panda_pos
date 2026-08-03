import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  HazardDashboardPeriods,
  HazardOrRiskCategories,
} from "../../api/hazardRiskApi";
import DateRangePicker from "../../components/DateRangePicker";
import { sampleDivisions } from "../../api/sampleData/documentData";

export default function AddOrEditHazardRiskDialog({
  defaultValues: defaultValues,
}) {
  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Accordion & Dividers" },
  ];
  const { isMobile, isTablet } = useIsMobile();
  const [selectedDemo, setSelectedDemo] = useState([]);
  const [addNewContactDialogOpen, setAddNewContactDialogOpen] = useState(false);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
  });

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
        <PageTitle title="Components" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>

      <Stack>
        <Accordion
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={{
              borderBottom: "1px solid var(--pallet-border-blue)",
              borderRadius: "0.3rem",
            }}
          >
            <Typography variant="subtitle2">Accordion</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                marginTop: "0.5rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  minWidth: "250px",
                }}
              >
                <Autocomplete
                  {...register("period", { required: false })}
                  size="small"
                  options={Object.values(HazardDashboardPeriods)}
                  sx={{ flex: 1, margin: "0.5rem" }}
                  onChange={(e, value) => {
                    setValue("period", value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.period}
                      label="Period"
                      name="period"
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flex: 2,
                  minWidth: "250px",
                  borderRadius: "0.3rem",
                }}
              >
                <DateRangePicker
                  control={control}
                  register={register}
                  errors={errors}
                  label="Enter a date Range"
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  minWidth: "250px",
                }}
              >
                <Autocomplete
                  {...register("division", { required: false })}
                  size="small"
                  options={sampleDivisions?.map((division) => division.name)}
                  sx={{ flex: 1, margin: "0.5rem" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.division}
                      label="Division"
                      name="division"
                    />
                  )}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  minWidth: "250px",
                }}
              >
                <Autocomplete
                  {...register("category", { required: false })}
                  size="small"
                  options={HazardOrRiskCategories?.map(
                    (category) => category.name
                  )}
                  sx={{ flex: 1, margin: "0.5rem" }}
                  onChange={(e, value) => {
                    setValue("category", value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.category}
                      label="Category"
                      name="category"
                    />
                  )}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "0.5rem",
                marginX: "0.5rem",
              }}
            >
              <Button
                onClick={() => reset()}
                sx={{
                  color: "var(--pallet-blue)",
                  marginRight: "0.5rem",
                }}
              >
                Reset
              </Button>
              <CustomButton
                variant="contained"
                sx={{
                  backgroundColor: "var(--pallet-blue)",
                }}
                size="medium"
                onClick={handleSubmit((data) => {
                  console.log("data", data);
                })}
              >
                Add Filter
              </CustomButton>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box
            mt={3}
        >
            <Typography m="1rem">Divider</Typography>
            <Divider/>
        </Box>
      </Stack>
    </>
  );
}
