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
  ToggleButton,
  ToggleButtonGroup,
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
import { Component, demoData, EnumButtons } from "../../api/componentApi";
import { useState } from "react";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import RichTextComponent from "../../components/RichTextComponent";
import DropzoneComponent from "../../components/DropzoneComponent";

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
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    control,
    formState: { errors },
  } = useForm<Component>({
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
        <PageTitle title="Input Fields" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
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
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              margin: "0.5rem",
            }}
          >
            <Controller
              control={control}
              name={"name"}
              render={({ field }) => {
                return (
                  <RichTextComponent
                    onChange={(e) => field.onChange(e)}
                    placeholder={field.value ?? "Description"}
                  />
                );
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              margin: "0.5rem",
            }}
          >
            <DropzoneComponent
              files={files}
              setFiles={setFiles}
              dropzoneLabel={
                "Drop your evidence here. Please ensure the image size is less than 10mb."
              }
            />
          </Box>
          <Box sx={{ margin: "0.5rem" }}>
            <Typography
              variant="body2"
              sx={{ marginBottom: "0.1rem", color: grey[700] }}
            >
              Toggle Buttons
            </Typography>
            <Controller
              control={control}
              name={"enumButton"}
              render={({ field }) => {
                return (
                  <ToggleButtonGroup
                    size="small"
                    {...control}
                    aria-label="Small sizes"
                    color="primary"
                    value={field.value}
                    exclusive
                    onChange={(e, value) => {
                      field.onChange(value);
                    }}
                  >
                    <ToggleButton
                      value={EnumButtons.DEMO_BUTTON_01}
                      key={EnumButtons.DEMO_BUTTON_01}
                    >
                      <Typography variant="caption" component="div">
                        {EnumButtons.DEMO_BUTTON_01}
                      </Typography>
                    </ToggleButton>
                    <ToggleButton
                      value={EnumButtons.DEMO_BUTTON_02}
                      key={EnumButtons.DEMO_BUTTON_02}
                    >
                      <Typography variant="caption" component="div">
                        {EnumButtons.DEMO_BUTTON_02}
                      </Typography>
                    </ToggleButton>
                  </ToggleButtonGroup>
                );
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </>
  );
}
