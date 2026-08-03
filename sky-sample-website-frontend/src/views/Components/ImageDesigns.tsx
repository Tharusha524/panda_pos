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
import ImageCarousel from "../../components/ImageCarousel";
import index1 from "../../assets/new1.png";
import index2 from "../../assets/new2.png";
import index3 from "../../assets/new3.png";

export default function ImageDesigns({ defaultValues: defaultValues }) {
  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Image Designs" },
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
        <PageTitle title="Image Designs" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
      <Stack
        sx={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          padding: "1rem",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            justifyContent: "center",
          }}
        >
          <Typography variant="h5" textAlign={"center"}>
            Image Caraousel
          </Typography>

          <ImageCarousel
            images={[
              { src: index1, alt: "Welcome" },
              { src: index2, alt: "Health & Safety" },
              { src: index3, alt: "Employee Engagement" },
            ]}
          />
        </Box>
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          padding: "1rem",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            justifyContent: "center",
          }}
        >
          <Typography variant="h5" textAlign={"center"}>
            Background Image
          </Typography>

          <Box
            component="img"
            src={index1}
            alt="Background image"
            sx={{
              height: "auto",
              width: "60vw",
              maxHeight: "50vh",
              objectFit: "contain",
              justifySelf: "center",
              alignSelf: "center",
            }}
          />
        </Box>
      </Stack>
    </>
  );
}
