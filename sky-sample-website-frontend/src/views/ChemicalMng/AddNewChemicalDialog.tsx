import {
  Dialog,
  DialogTitle,
  Typography,
  IconButton,
  Divider,
  DialogContent,
  Box,
  TextField,
  Autocomplete,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import {
  Chemical,
  createChemical,
  ZdhcUseCategory,
  UseOfPpe,
  HazardType,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import queryClient from "../../state/queryClient";
import CloseIcon from "@mui/icons-material/Close";
import AutoCheckBox from "../../components/AutoCheckbox";

export const AddNewChemicalDialog = ({
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
    control,
    watch,
    setValue,
    reset,
  } = useForm<Chemical>();
  const { isMobile } = useIsMobile();

  const handleCreateChemical = (data) => {
    createChemicalMutation(data);
  };

  const useOfPPE = watch("useOfPPE");
  const hazardType = watch("hazardType");

  const { mutate: createChemicalMutation, isPending: isChemicalCreating } =
    useMutation({
      mutationFn: createChemical,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["chemical-commercial-names"],
        });
        enqueueSnackbar("Chemical Created Successfully!", {
          variant: "success",
        });
        reset();
        setOpen(false);
      },
      onError: () => {
        enqueueSnackbar(`Chemical Create Failed`, {
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
      maxWidth="md"
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
          Add New Chemical
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
            {...register("commercialName", { required: true })}
            required
            id="commercialName"
            label="Commercial Name"
            size="small"
            error={!!errors.commercialName}
            helperText={errors.commercialName ? "Required" : ""}
            fullWidth
            sx={{ margin: "0.5rem", flex: 1 }}
          />
          <TextField
            id="substanceName"
            label="Substance Name"
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("substanceName")}
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
          />
          <TextField
            id="reachRegistrationNumber"
            label="Reach Registration Number"
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("reachRegistrationNumber")}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Autocomplete
            {...register("zdhcCategory")}
            size="small"
            options={Object.values(ZdhcUseCategory)}
            sx={{ flex: 1, margin: "0.5rem" }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ZDHC Use Category"
                name="zdhcCategory"
              />
            )}
          />
          <Autocomplete
            {...register("chemicalFormType")}
            size="small"
            options={["Liquid", "Solid", "Gas", "Plasma"]}
            sx={{ flex: 1, margin: "0.5rem" }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chemical Form Type"
                name="chemicalFormType"
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
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("whereAndWhyUse")}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Autocomplete
            {...register("zdhcLevel")}
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
              <TextField {...params} label="ZDHC Level" name="zdhcLevel" />
            )}
          />
          <TextField
            id="casNumber"
            label="CAS Number"
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("casNumber")}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
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
              setSelectedValues={(value) => setValue("useOfPPE", value)}
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
              setSelectedValues={(value) => setValue("hazardType", value)}
              getOptionLabel={(option) => option?.value || ""}
              getOptionValue={(option) => option?.value || ""}
              placeholder="Hazard Type"
              limitTags={1}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            id="colourIndex"
            label="Colour Index"
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("colourIndex")}
          />
          <TextField
            id="ghsClassification"
            label="GHS Classification"
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("ghsClassification")}
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
          disabled={isChemicalCreating}
          endIcon={isChemicalCreating ? <CircularProgress size={20} /> : null}
          onClick={handleSubmit(handleCreateChemical)}
        >
          Add Chemical
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};
