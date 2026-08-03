import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import useIsMobile from "../../customHooks/useIsMobile";
import CloseIcon from "@mui/icons-material/Close";
import { ChemicalCertificate } from "../../api/ChemicalManagement/ChemicalRequestApi";
import { useState } from "react";
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import { format } from "date-fns";
import { FileItemsViewer } from "../../components/FileItemsViewer";
import { StorageFile } from "../../utils/StorageFiles.util";

const ViewCertificateDialog = ({
  open,
  onClose,
  defaultValues,
}: {
  open: boolean;
  onClose: () => void;
  defaultValues: ChemicalCertificate;
}) => {
  const { isMobile } = useIsMobile();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth={"md"}
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
          Certificate Details
        </Typography>
        <IconButton
          aria-label="open drawer"
          onClick={onClose}
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
        <DrawerContentItem label="Test Name" value={defaultValues?.testName} />
        <Stack flexDirection={"row"}>
          <DrawerContentItem
            label="Testing Lab"
            value={defaultValues?.testLab}
          />
        </Stack>
        <Stack flexDirection={"row"}>
          <DrawerContentItem
            label="Test Date"
            value={
              defaultValues?.testDate
                ? format(new Date(defaultValues?.testDate), "yyyy-MM-dd")
                : "N/A"
            }
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Issued Date"
            value={
              defaultValues?.issuedDate
                ? format(new Date(defaultValues?.issuedDate), "yyyy-MM-dd")
                : "N/A"
            }
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Expiry Date"
            value={
              defaultValues?.expiryDate
                ? format(new Date(defaultValues?.expiryDate), "yyyy-MM-dd")
                : "N/A"
            }
            sx={{ flex: 1 }}
          />
        </Stack>
        <DrawerContentItem
          label="Positive List"
          value={defaultValues?.positiveList}
        />
        <DrawerContentItem
          label="Positive List"
          value={defaultValues?.description}
        />
        {defaultValues?.previewDocuments != null ? (
          <FileItemsViewer
            label="Report"
            files={defaultValues?.previewDocuments as StorageFile[]}
            sx={{ marginY: "1rem" }}
          />
        ) : (
          <FileItemsViewer
            label="Report"
            files={defaultValues?.documents as StorageFile[]}
            sx={{ marginY: "1rem" }}
          />
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button onClick={onClose} sx={{ color: "var(--pallet-blue)" }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewCertificateDialog;
