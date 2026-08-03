import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect, useMemo, useState } from "react";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { useMutation, useQuery } from "@tanstack/react-query";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import { useSnackbar } from "notistack";
import { fetchDivision } from "../../api/divisionApi";
import { fetchAllSupplierTypes } from "../../api/OccupationalHealth/supplierType";
import CustomButton from "../../components/CustomButton";
import DatePickerComponent from "../../components/DatePickerComponent";
import useIsMobile from "../../customHooks/useIsMobile";
import queryClient from "../../state/queryClient";
import theme from "../../theme";
import ApproveConfirmationModal from "../../components/ApproveConfirmationModal";
import {
  ChemicalCertificate,
  ChemicalPurchaseRequest,
  fetchAllSupplierNames,
  fetchProductStandards,
  HazardType,
  publishChemicalPurchase,
  updateChemicalPurchaseInventory,
  UseOfPpe,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import DropzoneComponent from "../../components/DropzoneComponent";
import { ExistingFileItemsEdit } from "../../components/ExistingFileItemsEdit";
import SwitchButton from "../../components/SwitchButton";
import { StorageFile } from "../../utils/StorageFiles.util";
import AutoCheckBox from "../../components/AutoCheckbox";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { format } from "date-fns";
import AddCertificateDialog from "./AddCertificateDialog";
import { deleteAccident } from "../../api/accidentAndIncidentApi";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ViewCertificateDialog from "./ViewCertificateDialog";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: ChemicalPurchaseRequest;
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function AddOrEditChemicalPurchaseAndInventoryDialog({
  open,
  handleClose,
  defaultValues,
}: DialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile, isTablet } = useIsMobile();
  const [files, setFiles] = useState<File[]>([]);

  const [removeCertificateArrayId, setRemoveCertificateArrayId] = useState<
    number[]
  >([]);

  const [activeTab, setActiveTab] = useState(0);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [existingFiles, setExistingFiles] = useState<StorageFile[]>(
    defaultValues?.documents as StorageFile[]
  );
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [addCertificateDialogOpen, setAddCertificateDialogOpen] =
    useState(false);

  console.log("defaultValues", files);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    getValues,
    trigger,
    setValue,
  } = useForm<ChemicalPurchaseRequest>({});

  const manufacturingDate = watch("manufacturingDate");
  const expiryDate = watch("expiryDate");

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    } else {
      reset();
    }
  }, [defaultValues, reset]);

  const resetForm = () => {
    reset();
    setFiles([]);
  };

  const handleCreateChemicalPurchaseInventory = (
    data: ChemicalPurchaseRequest
  ) => {
    const submitData: Partial<ChemicalPurchaseRequest> = data;
    console.log("submitData", submitData);
    submitData.removeCertificate = removeCertificateArrayId;
    submitData.documents = files;
    if (filesToRemove?.length > 0) submitData.removeDoc = filesToRemove;
    submitData.compliantWithTheLatestVersionOfZDHCandMRSL =
      data.compliantWithTheLatestVersionOfZDHCandMRSL ? "true" : "false";
    updateChemicalInventoryMutation(submitData as ChemicalPurchaseRequest);
  };

  const handlePublishChemicalPurchaseInventory = () => {
    const data = getValues();
    const submitData: Partial<ChemicalPurchaseRequest> = data;
    console.log("submitData", submitData);
    submitData.documents = files;
    if (filesToRemove?.length > 0) submitData.removeDoc = filesToRemove;
    submitData.compliantWithTheLatestVersionOfZDHCandMRSL =
      data.compliantWithTheLatestVersionOfZDHCandMRSL ? "true" : "false";
    publishChemicalPurchaseMutation(submitData as ChemicalPurchaseRequest);
  };

  const { data: productStandardList } = useQuery({
    queryKey: ["product-standards"],
    queryFn: fetchProductStandards,
  });

  const { data: divisionData } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivision,
  });

  const { data: supplierTypeData } = useQuery({
    queryKey: ["supplierType"],
    queryFn: fetchAllSupplierTypes,
  });

  const { data: supplierNameData } = useQuery({
    queryKey: ["supplierName"],
    queryFn: fetchAllSupplierNames,
  });

  const { mutate: updateChemicalInventoryMutation, isPending: isUpdating } =
    useMutation({
      mutationFn: updateChemicalPurchaseInventory,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["chemical-purchase-inventory"],
        });
        enqueueSnackbar(
          "Chemical Purchase Inventory Report Updated Successfully!",
          {
            variant: "success",
          }
        );
        handleClose();
      },
      onError: () => {
        enqueueSnackbar(`Chemical Purchase Inventory Update Failed`, {
          variant: "error",
        });
      },
    });

  const { mutate: publishChemicalPurchaseMutation, isPending: isPublishing } =
    useMutation({
      mutationFn: publishChemicalPurchase,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["chemical-purchase-inventory"],
        });
        enqueueSnackbar(
          "Chemical Purchase Inventory Report Published Successfully!",
          {
            variant: "success",
          }
        );
        handleClose();
        resetForm();
      },
      onError: () => {
        enqueueSnackbar(`Chemical Purchase Inventory Publish Failed`, {
          variant: "error",
        });
      },
    });

  const isChemicalDetailsValid = useMemo(() => {
    return (
      !errors.commercialName &&
      !errors.chemicalFormType &&
      !errors.requestQuantity &&
      !errors.requestUnit &&
      !errors.productStandard &&
      !errors.zdhcCategory
    );
  }, [
    errors.commercialName,
    errors.chemicalFormType,
    errors.requestQuantity,
    errors.requestUnit,
    errors.productStandard,
    errors.zdhcCategory,
  ]);

  const isSupplierDetailsValid = useMemo(() => {
    return (
      !errors.type &&
      !errors.name &&
      !errors.contactNumber &&
      !errors.emailId &&
      !errors.location &&
      !errors.zdhcLevel &&
      !errors.casNumber &&
      !errors.colourIndex
    );
  }, [
    errors.type,
    errors.name,
    errors.contactNumber,
    errors.emailId,
    errors.location,
    errors.zdhcLevel,
    errors.casNumber,
    errors.colourIndex,
  ]);

  const isPurchaseDetailsValid = useMemo(() => {
    return !errors.deliveryDate;
  }, [errors.deliveryDate]);

  const isStorageUsageValid = useMemo(() => {
    return !errors.useOfPPE && !errors.hazardType && !errors.ghsClassification;
  }, [errors.hazardType, errors.useOfPPE, errors.ghsClassification]);

  const triggerChemicalDetailsSection = () => {
    trigger([
      "commercialName",
      "chemicalFormType",
      "requestQuantity",
      "requestUnit",
      "productStandard",
      "zdhcCategory",
    ]);
  };

  const triggerSupplierDetailsSection = () => {
    trigger([
      "type",
      "name",
      "contactNumber",
      "emailId",
      "location",
      "zdhcLevel",
      "casNumber",
      "colourIndex",
    ]);
  };

  const triggerPurchaseDetailsSection = () => {
    trigger(["deliveryDate"]);
  };

  const triggerStorageUsageSection = () => {
    trigger(["useOfPPE", "hazardType", "ghsClassification"]);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 1) {
      triggerChemicalDetailsSection();
    } else if (newValue === 2) {
      triggerSupplierDetailsSection();
    } else if (newValue === 3) {
      triggerPurchaseDetailsSection();
    } else if (newValue === 4) {
      triggerStorageUsageSection();
    }

    setActiveTab(newValue);
  };

  const watchMSDS = watch("doYouHaveMSDSorSDS");
  const watchMsdsorsdsIssuedDate = watch("msdsorsdsIssuedDate");
  const useOfPPE = watch("useOfPPE");
  const hazardType = watch("hazardType");
  const certificatesWatch = watch("certificate");

  const [certificateViewDialogOpen, setCertificateViewDialogOpen] =
    useState(false);
  const [selectedViewCertificate, setSelectedViewCertificate] =
    useState<ChemicalCertificate | null>(null);

  return (
    <>
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
            {defaultValues
              ? "Edit an Chemical Purchase Inventory"
              : "Create a Chemical Purchase Inventory Item"}
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
          {Object.keys(errors).length > 0 && (
            <Alert
              severity="error"
              style={{ marginLeft: "1rem", marginRight: "1rem" }}
            >
              Please make sure to fill all the required fields with valid data
            </Alert>
          )}
          <Stack
            sx={{
              display: "flex",
              flexDirection: isTablet ? "column" : "row",
              padding: "1rem",
            }}
          >
            <Box
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
                  alignItems: "flex-end",
                  flexDirection: "column",
                  marginX: "0.5rem",
                  marginY: "1rem",
                }}
              >
                <Typography variant="body2" component="div">
                  <b>Request Date</b>
                </Typography>
                <Typography variant="body2" component="div">
                  {new Date().toDateString()}
                </Typography>
              </Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="secondary"
                TabIndicatorProps={{
                  style: {
                    backgroundColor:
                      isChemicalDetailsValid &&
                      isSupplierDetailsValid &&
                      isPurchaseDetailsValid &&
                      isStorageUsageValid
                        ? "var(--pallet-blue)"
                        : "var(--pallet-red)",
                    height: "3px",
                  },
                }}
                sx={{
                  backgroundColor: "var(--pallet-lighter-grey)",
                  color: "var(--pallet-blue)",
                  width: "100%",
                }}
                textColor="inherit"
                variant="scrollable"
                scrollButtons={true}
              >
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isChemicalDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <TextSnippetIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Chemical Details
                      </Typography>
                      {!isChemicalDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isSupplierDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <LocalShippingIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Supplier Details
                      </Typography>
                      {!isSupplierDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(1)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isPurchaseDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ReceiptLongIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Purchase Details
                      </Typography>
                      {!isPurchaseDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(2)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isStorageUsageValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ApartmentIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Storage & Usage
                      </Typography>
                      {!isStorageUsageValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(3)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isStorageUsageValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ApartmentIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Certificates/Test
                      </Typography>
                      {!isStorageUsageValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(4)}
                />
              </Tabs>
              <TabPanel value={activeTab} index={0} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--surface-bg)",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      required
                      id="commercialName "
                      label="Commercial Name"
                      error={!!errors.commercialName}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("commercialName", { required: true })}
                    />
                    <TextField
                      id="substanceName"
                      label="Substance Name"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("substanceName", { required: true })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="molecularFormula"
                      label="Molecular Formula"
                      {...register("molecularFormula")}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                    />
                    <Controller
                      name="chemicalFormType"
                      control={control}
                      defaultValue={defaultValues?.chemicalFormType}
                      {...register("chemicalFormType")}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={["Liquid", "Solid", "Gas", "Plasma"]}
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.chemicalFormType}
                              label="Chemical Form Type"
                              name="chemicalFormType"
                            />
                          )}
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="reachRegistrationNumber"
                      label="Reach Registration Number"
                      {...register("reachRegistrationNumber")}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                    />
                    <TextField
                      required
                      id="requestQuantity "
                      label="Requested Quantity"
                      error={!!errors.requestQuantity}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("requestQuantity", { required: true })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="requestUnit"
                      label="Requested Unit"
                      required
                      error={!!errors.requestUnit}
                      {...register("requestUnit", { required: true })}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                    />
                    <Controller
                      name="productStandard"
                      control={control}
                      defaultValue={defaultValues?.productStandard}
                      {...register("productStandard", {
                        required: true,
                      })}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={
                            productStandardList?.length
                              ? productStandardList.map(
                                  (standard) => standard.productStandard
                                )
                              : []
                          }
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.productStandard}
                              label="Product Standard"
                              name="productStandard"
                            />
                          )}
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="zdhcCategory"
                      {...register("zdhcCategory")}
                      label="ZDHC Category"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="whereAndWhyUse"
                      label="Where and Why it is Used?"
                      {...register("whereAndWhyUse")}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 1);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={1} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--surface-bg)",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <Controller
                      name="type"
                      control={control}
                      defaultValue={defaultValues?.type}
                      {...register("type", { required: true })}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={
                            supplierTypeData?.length
                              ? supplierTypeData.map(
                                  (supplier) => supplier.typeName
                                )
                              : []
                          }
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.type}
                              label="Type"
                              name="type"
                            />
                          )}
                        />
                      )}
                    />
                    <Controller
                      name="name"
                      control={control}
                      defaultValue={defaultValues?.name}
                      {...register("name", { required: true })}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={
                            supplierNameData?.length
                              ? supplierNameData.map(
                                  (supplier) => supplier.supplierName
                                )
                              : []
                          }
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.name}
                              label="Name"
                              name="name"
                            />
                          )}
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      id="manufactureName"
                      label="Manufacture Name"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("manufactureName")}
                    />
                    <TextField
                      id="contactNumber"
                      label="Contact Number"
                      required
                      size="small"
                      type="number"
                      error={!!errors.contactNumber}
                      helperText={errors.contactNumber ? "Required" : ""}
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("contactNumber", {
                        required: {
                          value: true,
                          message: "Required",
                        },
                      })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      id="emailId"
                      label="Email ID"
                      required
                      size="small"
                      type="email"
                      error={!!errors.emailId}
                      helperText={errors.emailId ? "Required" : ""}
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("emailId", {
                        required: true,
                      })}
                    />
                    <TextField
                      required
                      id="location"
                      label="Location / Country"
                      error={!!errors.location}
                      helperText={errors.location ? "Required" : ""}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("location", { required: true })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <Controller
                      name="zdhcLevel"
                      control={control}
                      defaultValue={defaultValues?.zdhcLevel}
                      {...register("zdhcLevel", { required: true })}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={[
                            "Not Applicable",
                            "Level 3",
                            "Level 2",
                            "Level 1",
                            "Level 0",
                          ]}
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.name}
                              label="ZDHC Level"
                              name="zdhcLevel"
                            />
                          )}
                        />
                      )}
                    />
                    <TextField
                      required
                      id="casNumber"
                      label="CAS Number"
                      error={!!errors.casNumber}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("casNumber", { required: true })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      required
                      id="colourIndex"
                      label="Colour Index"
                      error={!!errors.colourIndex}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("colourIndex", { required: true })}
                    />
                  </Box>
                  <Box sx={{ margin: "0.5rem" }}>
                    <Controller
                      control={control}
                      name={"doYouHaveMSDSorSDS"}
                      render={({ field }) => {
                        return (
                          <SwitchButton
                            label="Do you have an MSDS/SDS?"
                            onChange={field.onChange}
                            value={field.value}
                          />
                        );
                      }}
                    />
                  </Box>
                  {watchMSDS && (
                    <>
                      {defaultValues && (
                        <ExistingFileItemsEdit
                          label="Existing documents"
                          files={existingFiles}
                          sx={{ marginY: "1rem" }}
                          handleRemoveItem={(file) => {
                            if (file.gsutil_uri) {
                              setFilesToRemove([
                                ...filesToRemove,
                                file.gsutil_uri,
                              ]);
                              setExistingFiles(
                                existingFiles.filter(
                                  (f) => f.gsutil_uri !== file.gsutil_uri
                                )
                              );
                            }
                          }}
                        />
                      )}
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
                            "Drop Your MSDS/SDS document. Please ensure the document size is less than 5MB."
                          }
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flex: 1,
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        <Box sx={{ margin: "0.5rem", flex: 1 }}>
                          <Controller
                            control={control}
                            {...register("msdsorsdsIssuedDate", {
                              required: true,
                            })}
                            name={"msdsorsdsIssuedDate"}
                            render={({ field }) => {
                              return (
                                <DatePickerComponent
                                  onChange={(e) => field.onChange(e)}
                                  value={
                                    field.value ? new Date(field.value) : null
                                  }
                                  label="MSDS/SDS Issued Date"
                                  error={
                                    errors?.msdsorsdsIssuedDate
                                      ? "Required"
                                      : ""
                                  }
                                />
                              );
                            }}
                          />
                        </Box>
                        <Box sx={{ margin: "0.5rem", flex: 1 }}>
                          <Controller
                            control={control}
                            {...register("msdsorsdsExpiryDate", {
                              required: true,
                            })}
                            name={"msdsorsdsExpiryDate"}
                            render={({ field }) => {
                              return (
                                <DatePickerComponent
                                  onChange={(e) => field.onChange(e)}
                                  value={
                                    field.value ? new Date(field.value) : null
                                  }
                                  minDate={watchMsdsorsdsIssuedDate}
                                  label="MSDS/SDS Expiry Date"
                                  error={
                                    errors?.msdsorsdsExpiryDate
                                      ? "Required"
                                      : ""
                                  }
                                />
                              );
                            }}
                          />
                        </Box>
                      </Box>
                    </>
                  )}
                  <Box sx={{ margin: "0.5rem" }}>
                    <Controller
                      control={control}
                      name={"compliantWithTheLatestVersionOfZDHCandMRSL"}
                      render={({ field }) => {
                        return (
                          <SwitchButton
                            label="Complaint with the latest version of ZDHC and MRSL?"
                            onChange={field.onChange}
                            value={
                              Boolean(field.value) && field.value !== "false"
                            }
                          />
                        );
                      }}
                    />
                  </Box>
                  <Box sx={{ margin: "0.5rem" }}>
                    <Controller
                      control={control}
                      name={"apeoOrNpeFreeComplianceStatement"}
                      render={({ field }) => {
                        return (
                          <SwitchButton
                            label="APEO/NPE free compliance statement?"
                            onChange={field.onChange}
                            value={
                              Boolean(field.value) && field.value !== "false"
                            }
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
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 0);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 2);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={2} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--surface-bg)",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <Controller
                      control={control}
                      {...register("manufacturingDate", { required: true })}
                      name={"manufacturingDate"}
                      render={({ field }) => {
                        return (
                          <Box sx={{ flex: 1, margin: "0.5rem" }}>
                            <DatePickerComponent
                              onChange={(e) => field.onChange(e)}
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              label="Manufacturing Date"
                              error={
                                errors?.manufacturingDate ? "Required" : ""
                              }
                            />
                          </Box>
                        );
                      }}
                    />
                    <Controller
                      control={control}
                      {...register("expiryDate", { required: true })}
                      name={"expiryDate"}
                      render={({ field }) => {
                        return (
                          <Box sx={{ flex: 1, margin: "0.5rem" }}>
                            <DatePickerComponent
                              onChange={(e) => field.onChange(e)}
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              label="Expiry Date"
                              error={errors?.expiryDate ? "Required" : ""}
                              minDate={manufacturingDate}
                            />
                          </Box>
                        );
                      }}
                    />
                    <Controller
                      control={control}
                      {...register("deliveryDate", { required: true })}
                      name={"deliveryDate"}
                      render={({ field }) => {
                        return (
                          <Box sx={{ flex: 1, margin: "0.5rem" }}>
                            <DatePickerComponent
                              onChange={(e) => field.onChange(e)}
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              label="Delivery Date"
                              minDate={manufacturingDate}
                              maxDate={expiryDate}
                              error={errors?.deliveryDate ? "Required" : ""}
                            />
                          </Box>
                        );
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <TextField
                      required
                      id="deliveryQuantity"
                      label="Delivery Quantity"
                      error={!!errors.deliveryQuantity}
                      size="small"
                      type="number"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      helperText={
                        errors.deliveryQuantity &&
                        errors.deliveryQuantity.message
                      }
                      {...register("deliveryQuantity", {
                        required: {
                          value: true,
                          message: "Required",
                        },
                        min: {
                          value: 0,
                          message: "Delivery quantity must be greater than 0",
                        },
                      })}
                    />
                    <Controller
                      name="deliveryUnit"
                      control={control}
                      defaultValue={defaultValues?.deliveryUnit ?? ""}
                      {...register("deliveryUnit", { required: true })}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          size="small"
                          options={[
                            "KG",
                            "L",
                            "G",
                            "ML",
                            "M",
                            "CM",
                            "MM",
                            "PCS",
                          ]}
                          sx={{ flex: 1, margin: "0.5rem" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required
                              error={!!errors.deliveryUnit}
                              helperText={errors.deliveryUnit && "Required"}
                              label="Delivery Unit"
                              name="deliveryUnit"
                            />
                          )}
                        />
                      )}
                    />
                    <TextField
                      required
                      id="purchaseAmount"
                      label="Purchased Amount"
                      error={!!errors.purchaseAmount}
                      size="small"
                      type="number"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      helperText={
                        errors.purchaseAmount && errors.purchaseAmount.message
                      }
                      {...register("purchaseAmount", {
                        required: {
                          value: true,
                          message: "Required",
                        },
                        min: {
                          value: 0,
                          message: "Purchase amount must be greater than 0",
                        },
                      })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      required
                      id="thresholdLimit"
                      label="Threshold Limit"
                      error={!!errors.thresholdLimit}
                      size="small"
                      type="number"
                      sx={{
                        flex: 1,
                        margin: "0.5rem",
                        marginTop: isMobile ? "0.5rem" : "1.85rem",
                      }}
                      helperText={
                        errors.thresholdLimit && errors.thresholdLimit.message
                      }
                      {...register("thresholdLimit", {
                        required: {
                          value: true,
                          message: "Required",
                        },
                        min: {
                          value: 0,
                          message: "Threshold limit must be greater than 0",
                        },
                      })}
                    />
                    <Controller
                      control={control}
                      {...register("invoiceDate", { required: true })}
                      name={"invoiceDate"}
                      render={({ field }) => {
                        return (
                          <Box sx={{ flex: 1, margin: "0.5rem" }}>
                            <DatePickerComponent
                              onChange={(e) => field.onChange(e)}
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              label="Invoice Date"
                              error={errors?.invoiceDate ? "Required" : ""}
                            />
                          </Box>
                        );
                      }}
                    />
                    <TextField
                      required
                      id="invoiceReference"
                      label="Invoice Reference"
                      error={!!errors.invoiceReference}
                      size="small"
                      sx={{
                        flex: 1,
                        margin: "0.5rem",
                        marginTop: isMobile ? "0.5rem" : "1.85rem",
                      }}
                      {...register("invoiceReference", { required: true })}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 1);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 3);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={3} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--surface-bg)",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <Box sx={{ flex: 1, margin: "0.5rem" }}>
                      <AutoCheckBox
                        control={control}
                        name="useOfPPE"
                        label="Use of PPE"
                        options={Object.keys(UseOfPpe)?.map((key) => ({
                          label: key,
                          value: UseOfPpe[key],
                        }))}
                        selectedValues={useOfPPE}
                        setSelectedValues={(value) =>
                          setValue("useOfPPE", value)
                        }
                        getOptionLabel={(option) => option?.label || ""}
                        getOptionValue={(option) => option?.value || ""}
                        placeholder="Use of PPE"
                        limitTags={1}
                      />
                    </Box>
                    <Box sx={{ flex: 1, margin: "0.5rem" }}>
                      <AutoCheckBox
                        control={control}
                        required={false}
                        name="hazardType"
                        label="Hazard Type"
                        options={Object.keys(HazardType)?.map((key) => ({
                          label: key,
                          value: HazardType[key],
                        }))}
                        selectedValues={hazardType}
                        setSelectedValues={(value) =>
                          setValue("hazardType", value)
                        }
                        getOptionLabel={(option) => option?.value || ""}
                        getOptionValue={(option) => option?.value || ""}
                        placeholder="Hazard Type"
                        limitTags={1}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex" }}>
                    {" "}
                    <TextField
                      id="ghsClassification"
                      label="GHS Classification"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("ghsClassification")}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      id="hazardStatement"
                      label="Hazard Statement Codes"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("hazardStatement")}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      id="storageConditionRequirements"
                      label="Storage Condition Requirements"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("storageConditionRequirements")}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                    }}
                  >
                    <TextField
                      id="storagePlace"
                      label="Storage Place"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("storagePlace")}
                    />
                    <TextField
                      id="lotNumber"
                      label="LOT Number"
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("lotNumber")}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 3);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 4);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={4} dir={theme.direction}>
                <Stack sx={{ alignItems: "center", m: "0.5rem" }}>
                  <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{
                      overflowX: "auto",
                      maxWidth: isMobile ? "88vw" : "100%",
                    }}
                  >
                    <Box
                      sx={{
                        padding: theme.spacing(2),
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: "var(--pallet-blue)" }}
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setAddCertificateDialogOpen(true);
                        }}
                      >
                        Add Certificate
                      </Button>
                    </Box>
                    <Table aria-label="simple table">
                      <TableHead
                        sx={{
                          backgroundColor: "var(--pallet-lighter-grey)",
                        }}
                      >
                        <TableRow>
                          <TableCell align="center">Name</TableCell>
                          <TableCell align="center">Test Date</TableCell>
                          <TableCell align="center">Testing Lab</TableCell>
                          <TableCell align="center">Issued Date</TableCell>
                          <TableCell align="center">Expiry Date</TableCell>
                          <TableCell align="center"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certificatesWatch?.length > 0 ? (
                          certificatesWatch?.map((row) => (
                            <TableRow
                              // key={`${row.id}`}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                                cursor: "pointer",
                              }}
                            >
                              <TableCell
                                component="th"
                                scope="row"
                                align="center"
                              >
                                {row?.testName}
                              </TableCell>
                              <TableCell align="center">
                                {row?.testDate
                                  ? format(
                                      new Date(row?.testDate),
                                      "yyyy-MM-dd"
                                    )
                                  : "--"}
                              </TableCell>
                              <TableCell align="center">
                                {row?.testLab}
                              </TableCell>
                              <TableCell align="center">
                                {row?.issuedDate
                                  ? format(
                                      new Date(row?.issuedDate),
                                      "yyyy-MM-dd"
                                    )
                                  : "--"}
                              </TableCell>
                              <TableCell align="center">
                                {row?.expiryDate
                                  ? format(
                                      new Date(row?.expiryDate),
                                      "yyyy-MM-dd"
                                    )
                                  : "--"}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  onClick={() => {
                                    const filteredCertificates = (
                                      certificatesWatch ?? []
                                    ).filter((item) => {
                                      const isFileInstance =
                                        item.documents instanceof File;
                                      const shouldKeep =
                                        item.certificateId !==
                                          row.certificateId || isFileInstance;

                                      if (!shouldKeep && row.certificateId) {
                                        setRemoveCertificateArrayId((prev) => [
                                          ...prev,
                                          row.certificateId,
                                        ]);
                                      }

                                      return shouldKeep;
                                    });

                                    setValue(
                                      "certificate",
                                      filteredCertificates
                                    );
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => {
                                    setSelectedViewCertificate(row);
                                    setCertificateViewDialogOpen(true);
                                  }}
                                >
                                  <VisibilityOutlinedIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} align="center">
                              <Typography variant="body2">
                                No Records found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </TabPanel>
            </Box>
            <Box
              sx={{
                display: "flex",
                flex: { lg: 1, md: 1 },
                flexDirection: "column",
                backgroundColor: "var(--surface-bg)",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                padding: "1rem",
                borderRadius: "0.3rem",
                marginY: isTablet ? "0.5rem" : 0,
                marginLeft: isTablet ? 0 : "0.5rem",
                height: "fit-content",
              }}
            >
              {defaultValues && (
                <>
                  <Typography
                    variant="caption"
                    sx={{ marginLeft: "0.5rem", color: grey[700] }}
                  >
                    Status
                  </Typography>
                  <Box>
                    {defaultValues.status === "approved" ? (
                      <Chip label="Request Approved" />
                    ) : defaultValues.status === "published" ? (
                      <Chip
                        label="Published"
                        sx={{
                          backgroundColor: "var(--pallet-blue)",
                          color: "white",
                        }}
                      />
                    ) : (
                      "--"
                    )}
                  </Box>
                  <Box sx={{ margin: "0.5rem" }}>
                    <Typography
                      variant="caption"
                      sx={{ marginBottom: "0.1rem", color: grey[700] }}
                    >
                      Updated By
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ marginBottom: "0.1rem", color: grey[700] }}
                    >
                      {defaultValues?.updatedBy?.name ?? "--"}
                    </Typography>
                  </Box>
                  <Box sx={{ margin: "0.5rem" }}>
                    <Typography
                      variant="caption"
                      sx={{ marginBottom: "0.1rem", color: grey[700] }}
                    >
                      Approved By
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ marginBottom: "0.1rem", color: grey[700] }}
                    >
                      {defaultValues?.approvedBy?.name ?? "--"}
                    </Typography>
                  </Box>
                </>
              )}
              <Box sx={{ margin: "0.5rem" }}>
                <Controller
                  name="division"
                  control={control}
                  defaultValue={defaultValues?.division ?? ""}
                  {...register("division", { required: true })}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      onChange={(event, newValue) => field.onChange(newValue)}
                      size="small"
                      options={
                        divisionData?.length
                          ? divisionData.map(
                              (division) => division.divisionName
                            )
                          : []
                      }
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.division}
                          helperText={errors.division && "Required"}
                          label="Division"
                          name="division"
                        />
                      )}
                    />
                  )}
                />
              </Box>
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
            sx={{
              backgroundColor: "var(--pallet-grey)",
            }}
            startIcon={
              isUpdating ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <SaveIcon />
              )
            }
            disabled={isUpdating}
            size="medium"
            onClick={handleSubmit((data) => {
              handleCreateChemicalPurchaseInventory(data);
            })}
          >
            {defaultValues ? "Save Draft" : "Submit Item"}
          </CustomButton>
          <CustomButton
            variant="contained"
            sx={{
              backgroundColor: "var(--pallet-blue)",
            }}
            size="medium"
            startIcon={
              isPublishing ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <PublishIcon />
              )
            }
            disabled={isPublishing}
            onClick={() =>
              trigger().then((isValid) => {
                if (isValid) {
                  setPublishModalOpen(true);
                }
              })
            }
          >
            Publish Inventory Item
          </CustomButton>
        </DialogActions>
        {addCertificateDialogOpen && (
          <AddCertificateDialog
            open={addCertificateDialogOpen}
            onClose={() => setAddCertificateDialogOpen(false)}
            onSubmit={(data) => {
              console.log("Certificate Data", data);
              setValue("certificate", [...(certificatesWatch ?? []), data]);
              setAddCertificateDialogOpen(false);
            }}
          />
        )}

        {publishModalOpen && (
          <ApproveConfirmationModal
            open={publishModalOpen}
            title="Publish Chemical Purchase Inventory Confirmation"
            content={
              <>
                Are you sure you want to publish this Chemical Purchase
                Inventory Item?
                <Alert severity="warning" style={{ marginTop: "1rem" }}>
                  This action is not reversible.
                </Alert>
              </>
            }
            handleClose={() => setPublishModalOpen(false)}
            approveFunc={async () => {
              const isValid = await trigger();
              if (isValid) {
                handlePublishChemicalPurchaseInventory();
              } else {
                enqueueSnackbar("Please fill in all required fields.", {
                  variant: "error",
                });
                setPublishModalOpen(false);
                throw new Error("Form Validation Error");
              }
            }}
            onSuccess={() => {}}
            handleReject={() => {}}
          />
        )}
      </Dialog>
      <ViewCertificateDialog
        open={certificateViewDialogOpen}
        onClose={() => setCertificateViewDialogOpen(false)}
        defaultValues={selectedViewCertificate}
      />
    </>
  );
}
