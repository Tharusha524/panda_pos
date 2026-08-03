import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Autocomplete,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ChemicalRequest,
  createChemicalRequest,
  fetchChemicalCommercialNames,
  fetchProductStandards,
  updateChemicalRequest,
  ZdhcUseCategory,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import useIsMobile from "../../customHooks/useIsMobile";
import CustomButton from "../../components/CustomButton";
import DatePickerComponent from "../../components/DatePickerComponent";
import SwitchButton from "../../components/SwitchButton";
import DropzoneComponent from "../../components/DropzoneComponent";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchDivision } from "../../api/divisionApi";
import UserAutoComplete from "../../components/UserAutoComplete";
import { fetchAllUsers } from "../../api/userApi";
import AddIcon from "@mui/icons-material/Add";

import queryClient from "../../state/queryClient";
import { useSnackbar } from "notistack";
import { AddNewStandardDialog } from "./AddNewStandardDialog";
import { AddNewChemicalDialog } from "./AddNewChemicalDialog";
import {
  createActionPlan,
  updateActionPlan,
} from "../../api/AuditAndInspection/internalAudit";
import { StorageFile } from "../../utils/StorageFiles.util";
import { ExistingFileItemsEdit } from "../../components/ExistingFileItemsEdit";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: ChemicalRequest;
};

export default function AddOrEditChemicalRequestDialog({
  open,
  handleClose,
  defaultValues,
}: DialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile, isTablet } = useIsMobile();
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<StorageFile[]>(
    defaultValues?.documents as StorageFile[]
  );
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [openAddNewChemicalDialog, setOpenAddNewChemicalDialog] =
    useState(false);
  const [openAddNewStandardDialog, setOpenAddNewStandardDialog] =
    useState(false);

  const { data: divisionData, isFetching: isDivisionDataFetching } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivision,
  });

  const { data: userData = [], isFetching: isUserDataFetching } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchAllUsers(500),
  });

  const { data: chemicalData } = useQuery({
    queryKey: ["chemical-commercial-names"],
    queryFn: fetchChemicalCommercialNames,
  });

  const { data: productStandardList } = useQuery({
    queryKey: ["product-standards"],
    queryFn: fetchProductStandards,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ChemicalRequest>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchMSDS = watch("doYouHaveMSDSorSDS");

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

  const handleSubmitChemicalRequest = (data: ChemicalRequest) => {
    const submitData: Partial<ChemicalRequest> = data;
    submitData.reviewerId = data.reviewer?.id;
    submitData.documents = files;
    if (defaultValues) {
      submitData.id = defaultValues.id;
      if (filesToRemove?.length > 0) submitData.removeDoc = filesToRemove;
      updateChemicalRequestMutation({ data: submitData });
    } else {
      createChemicalRequestMutation({ data: submitData });
    }

    resetForm();
  };

  const {
    mutate: createChemicalRequestMutation,
    isPending: isChemicalRequestCreating,
  } = useMutation({
    mutationFn: createChemicalRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chemical-requests"],
      });
      enqueueSnackbar("Chemical Request Created Successfully!", {
        variant: "success",
      });
      reset();
      handleClose();
    },
    onError: () => {
      enqueueSnackbar(`Chemical Request Create Failed`, {
        variant: "error",
      });
    },
  });

  const {
    mutate: updateChemicalRequestMutation,
    isPending: isChemicalRequestUpdating,
  } = useMutation({
    mutationFn: updateChemicalRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chemical-requests"],
      });
      enqueueSnackbar("Chemical Request Updated Successfully!", {
        variant: "success",
      });
      reset();
      handleClose();
    },
    onError: () => {
      enqueueSnackbar(`Chemical Request Update Failed`, {
        variant: "error",
      });
    },
  });

  const AddNewChemicalButton = (props) => (
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
        setOpenAddNewChemicalDialog(true);
      }}
    >
      <AddIcon />
      <Typography variant="body2" component="div">
        Add a new chemical
      </Typography>
    </li>
  );

  const AddNewStandardButton = (props) => (
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
        setOpenAddNewStandardDialog(true);
      }}
    >
      <AddIcon />
      <Typography variant="body2" component="div">
        Add a new standard
      </Typography>
    </li>
  );

  const watchMsdsorsdsIssuedDate = watch("msdsorsdsIssuedDate");
  const watchCommercialName = watch("requestDate");
  console.log("def", defaultValues, watchCommercialName);
  return (
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
      <AddNewChemicalDialog
        open={openAddNewChemicalDialog}
        setOpen={setOpenAddNewChemicalDialog}
      />
      <AddNewStandardDialog
        open={openAddNewStandardDialog}
        setOpen={setOpenAddNewStandardDialog}
      />
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
            ? "Edit Chemical Request"
            : "Add a New Chemical Request"}
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
        <Stack
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            padding: "1rem",
          }}
        >
          <Stack
            sx={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--surface-bg)",
              flex: 3,
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
                margin: "0.5rem",
              }}
            >
              <Typography variant="body2" component="div">
                <b>Date</b>
              </Typography>
              <Typography variant="body2" component="div">
                {new Date().toDateString()}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Autocomplete
                {...register("commercialName", { required: true })}
                size="small"
                noOptionsText={
                  <>
                    <Typography variant="body2" color="inherit" gutterBottom>
                      No matching Items
                    </Typography>
                  </>
                }
                options={[
                  ...(chemicalData?.length
                    ? chemicalData.map((chemical) => chemical.commercialName)
                    : []),
                  "$ADD_NEW_CHEMICAL",
                ]}
                renderOption={(props, option) => (
                  <>
                    {option === "$ADD_NEW_CHEMICAL" ? (
                      <AddNewChemicalButton {...props} />
                    ) : (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    )}
                  </>
                )}
                sx={{ flex: 1, margin: "0.5rem" }}
                onChange={async (_, data) => {
                  const selectedChemical = chemicalData?.find(
                    (chemical) => chemical.commercialName === data
                  );
                  if (selectedChemical?.commercialName) {
                    await setValue(
                      "commercialName",
                      selectedChemical?.commercialName
                    );
                    await setValue(
                      "substanceName",
                      selectedChemical?.substanceName
                    );
                    await setValue(
                      "molecularFormula",
                      selectedChemical?.molecularFormula
                    );
                    await setValue(
                      "reachRegistrationNumber",
                      selectedChemical?.reachRegistrationNumber
                    );
                    await setValue(
                      "zdhcCategory",
                      selectedChemical?.zdhcCategory
                    );
                    await setValue(
                      "chemicalFormType",
                      selectedChemical?.chemicalFormType
                    );
                    await setValue(
                      "whereAndWhyUse",
                      selectedChemical?.whereAndWhyUse
                    );
                  }
                }}
                defaultValue={defaultValues?.commercialName}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={!!errors.commercialName}
                    helperText={errors.commercialName ? "Required" : ""}
                    label="Commercial Name"
                    name="commercialName"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
              <TextField
                id="substanceName"
                label="substanceName"
                size="small"
                sx={{ flex: 1, margin: "0.5rem" }}
                {...register("substanceName")}
                slotProps={{ inputLabel: { shrink: true } }}
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
                size="small"
                sx={{ flex: 1, margin: "0.5rem" }}
                {...register("molecularFormula")}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                id="reachRegistrationNumber"
                label="Reach Registration Number"
                size="small"
                sx={{ flex: 1, margin: "0.5rem" }}
                {...register("reachRegistrationNumber")}
                slotProps={{ inputLabel: { shrink: true } }}
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
                id="requestQuantity"
                label="Requested Quantity"
                error={!!errors.requestQuantity}
                size="small"
                type="number"
                sx={{ flex: 1, margin: "0.5rem" }}
                helperText={
                  errors.requestQuantity ? errors.requestQuantity.message : ""
                }
                {...register("requestQuantity", {
                  required: {
                    value: true,
                    message: "Required",
                  },
                  min: {
                    value: 0,
                    message: "Quantity must be greater than 0",
                  },
                })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Autocomplete
                {...register("requestUnit", { required: true })}
                size="small"
                options={["KG", "L", "G", "ML", "M", "CM", "MM", "PCS"]}
                defaultValue={defaultValues?.requestUnit}
                sx={{ flex: 1, margin: "0.5rem" }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    error={!!errors.requestUnit}
                    helperText={errors.requestUnit ? "Required" : ""}
                    label="Requested Unit"
                    name="requestUnit"
                    slotProps={{ inputLabel: { shrink: true } }}
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
              <Controller
                name="zdhcCategory"
                control={control}
                defaultValue={defaultValues?.zdhcCategory ?? ""}
                {...register("zdhcCategory", {
                  required: true,
                })}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    size="small"
                    options={Object.values(ZdhcUseCategory)}
                    sx={{ flex: 1, margin: "0.5rem" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={!!errors.zdhcCategory}
                        helperText={errors.zdhcCategory && "Required"}
                        label="ZDHC Use Category"
                        name="zdhcCategory"
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="chemicalFormType"
                control={control}
                defaultValue={defaultValues?.chemicalFormType ?? ""}
                {...register("chemicalFormType", {
                  required: true,
                })}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    size="small"
                    options={["Liquid", "Solid", "Gas", "Plasma"]}
                    sx={{ flex: 1, margin: "0.5rem" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={!!errors.chemicalFormType}
                        helperText={errors.chemicalFormType && "Required"}
                        label="Chemical Form Type"
                        name="chemicalFormType"
                        slotProps={{ inputLabel: { shrink: true } }}
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
                id="whereAndWhyUse"
                label="Where and Why it is used?"
                error={!!errors.whereAndWhyUse}
                helperText={errors.whereAndWhyUse ? "Required" : ""}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
                sx={{ flex: 1, margin: "0.5rem" }}
                {...register("whereAndWhyUse", { required: true })}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flex: 2,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Autocomplete
                {...register("productStandard")}
                size="small"
                noOptionsText={
                  <>
                    <Typography variant="body2" color="inherit" gutterBottom>
                      No matching Items
                    </Typography>
                  </>
                }
                options={[
                  ...(productStandardList?.length
                    ? productStandardList.map(
                        (standard) => standard.productStandard
                      )
                    : []),
                  "$ADD_NEW_STANDARD",
                ]}
                defaultValue={defaultValues?.productStandard}
                renderOption={(props, option) => (
                  <>
                    {option === "$ADD_NEW_STANDARD" ? (
                      <AddNewStandardButton {...props} />
                    ) : (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    )}
                  </>
                )}
                sx={{ flex: 1, margin: "0.5rem" }}
                onChange={async (_, data) => {
                  const selectedStandard = productStandardList?.find(
                    (standard) => standard.name === data
                  );
                  console.log("selectedChemical", selectedStandard);
                  if (selectedStandard?.name) {
                    await setValue("productStandard", selectedStandard?.name);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={!!errors.productStandard}
                    label="Product Standard"
                    name="productStandard"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
              <Box sx={{ flex: 1, margin: "0.5rem" }}></Box>
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
                        setFilesToRemove([...filesToRemove, file.gsutil_uri]);
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
                      {...register("msdsorsdsIssuedDate", { required: true })}
                      name={"msdsorsdsIssuedDate"}
                      render={({ field }) => {
                        return (
                          <DatePickerComponent
                            onChange={(e) => field.onChange(e)}
                            value={field.value ? new Date(field.value) : null}
                            label="MSDS/SDS Issued Date"
                            error={
                              errors?.msdsorsdsIssuedDate ? "Required" : ""
                            }
                          />
                        );
                      }}
                    />
                  </Box>
                  <Box sx={{ margin: "0.5rem", flex: 1 }}>
                    <Controller
                      control={control}
                      {...register("msdsorsdsExpiryDate", { required: true })}
                      name={"msdsorsdsExpiryDate"}
                      render={({ field }) => {
                        return (
                          <DatePickerComponent
                            onChange={(e) => field.onChange(e)}
                            value={field.value ? new Date(field.value) : null}
                            minDate={watchMsdsorsdsIssuedDate}
                            label="MSDS/SDS Expiry Date"
                            error={
                              errors?.msdsorsdsExpiryDate ? "Required" : ""
                            }
                          />
                        );
                      }}
                    />
                  </Box>
                </Box>
              </>
            )}
          </Stack>
          <Stack
            sx={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              backgroundColor: "var(--surface-bg)",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              padding: "0.5rem",
              borderRadius: "0.3rem",
              marginY: isTablet ? "0.5rem" : 0,
              marginLeft: isTablet ? 0 : "0.5rem",
              height: "fit-content",
            }}
          >
            <Box sx={{ margin: "0.5rem" }}>
              <Controller
                control={control}
                {...register("requestDate", { required: true })}
                name={"requestDate"}
                render={({ field }) => {
                  return (
                    <DatePickerComponent
                      onChange={(e) => field.onChange(e)}
                      value={field.value ? new Date(field.value) : null}
                      label="Request Date"
                      error={errors?.requestDate ? "Required" : ""}
                    />
                  );
                }}
              />
            </Box>
            <Box sx={{ margin: "0.5rem" }}>
              <Autocomplete
                {...register("division", { required: false })}
                size="small"
                options={
                  divisionData?.length
                    ? divisionData.map((division) => division.divisionName)
                    : []
                }
                sx={{ flex: 1 }}
                defaultValue={defaultValues?.division}
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
            <TextField
              id="requestedCustomer"
              label="Requested Customer"
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("requestedCustomer")}
            />
            <TextField
              id="requestedMerchandiser"
              label="Requested Merchandiser"
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("requestedMerchandiser")}
            />
            <Box>
              <UserAutoComplete
                name="reviewer"
                label="reviewer"
                control={control}
                register={register}
                errors={errors}
                userData={userData}
                defaultValue={defaultValues?.reviewer}
                required={true}
              />
            </Box>
          </Stack>
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
            backgroundColor: "var(--pallet-blue)",
          }}
          size="medium"
          startIcon={
            isChemicalRequestCreating || isChemicalRequestUpdating ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
          disabled={isChemicalRequestCreating || isChemicalRequestUpdating}
          onClick={handleSubmit((data) => {
            handleSubmitChemicalRequest(data);
          })}
        >
          {defaultValues ? "Update Changes" : "Save Chemical Request"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
