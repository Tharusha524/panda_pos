import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import useIsMobile from "../../customHooks/useIsMobile";
import {
  approveChemicalRequest,
  ChemicalRequest,
  ChemicalRequestStatus,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import CustomButton from "../../components/CustomButton";
import { useState } from "react";
import ApproveConfirmationModal from "../../components/ApproveConfirmationModal";
import { FileItemsViewer } from "../../components/FileItemsViewer";
import { StorageFile } from "../../utils/StorageFiles.util";
import { useMutation } from "@tanstack/react-query";
import queryClient from "../../state/queryClient";
import { useSnackbar } from "notistack";

function ViewChemicalRequestContent({
  chemicalRequest,
  handleCloseViewDrawer,
}: {
  chemicalRequest: ChemicalRequest;
  handleCloseViewDrawer: () => void;
}) {
  const { isTablet } = useIsMobile();
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const {
    mutate: approveChemicalRequestMutation,
    isPending: isChemicalRequestApproving,
  } = useMutation({
    mutationFn: approveChemicalRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chemical-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["chemical-purchase-inventory"],
      });
      enqueueSnackbar("Chemical Request Approved Successfully!", {
        variant: "success",
      });
      setApproveDialogOpen(false);
      handleCloseViewDrawer();
    },
    onError: () => {
      enqueueSnackbar(`Chemical Request Approve Failed`, {
        variant: "error",
      });
    },
  });

  return (
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
            p: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="Reference Number"
            value={chemicalRequest.referenceNumber}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Request Created Date"
            value={
              chemicalRequest.created_at
                ? format(new Date(chemicalRequest.created_at), "dd/MM/yyyy")
                : "--"
            }
            sx={{ flex: 1 }}
          />
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="Commercial Name"
            value={chemicalRequest.commercialName}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Substance Name"
            value={chemicalRequest.substanceName}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Molecular Formula"
            value={chemicalRequest.molecularFormula}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="Requested Quantity"
            value={chemicalRequest.requestQuantity}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Requested Unit"
            value={chemicalRequest.requestUnit}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="Reach Registration Number"
            value={chemicalRequest.reachRegistrationNumber}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Product Standard"
            value={chemicalRequest.productStandard}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="ZDHC Use Category"
            value={chemicalRequest.zdhcCategory}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Chemical Form Type"
            value={chemicalRequest.chemicalFormType}
            sx={{ flex: 1 }}
          />
        </Box>
        <DrawerContentItem
          label="Where and Why it is used"
          value={chemicalRequest.whereAndWhyUse}
          sx={{ flex: 1 }}
        />
        <DrawerContentItem
          label="MSDS/SDS have or not"
          value={chemicalRequest.doYouHaveMSDSorSDS ? "Yes" : "No"}
          sx={{ flex: 1 }}
        />
        {chemicalRequest.doYouHaveMSDSorSDS && (
          <Box>
            <FileItemsViewer
              label="MSDS/SDS documents"
              files={chemicalRequest.documents as StorageFile[]}
              sx={{ marginY: "1rem" }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
                marginY: "1rem",
              }}
            >
              <DrawerContentItem
                label="MSDS/SDS Issued Date"
                value={format(
                  new Date(chemicalRequest.msdsorsdsIssuedDate),
                  "dd/MM/yyyy"
                )}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="MSDS/SDS Expiry Date"
                value={format(
                  new Date(chemicalRequest.msdsorsdsExpiryDate),
                  "dd/MM/yyyy"
                )}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        )}
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
        <Typography
          variant="caption"
          sx={{
            marginBottom: "0.5rem",
            color: "var(--pallet-grey)",
            marginLeft: "0.5rem",
          }}
        >
          Approval Information
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            objectFit: "contain",
            marginBottom: "0.5rem",
            marginLeft: "0.5rem",
          }}
        >
          {chemicalRequest.status === ChemicalRequestStatus.DRAFT ? (
            <Chip label="Pending" />
          ) : (
            <Chip
              label="Approved"
              sx={{
                backgroundColor: "var(--pallet-blue)",
                color: "white",
              }}
            />
          )}
        </Box>
        <DrawerContentItem
          label="Reviewer"
          value={chemicalRequest.reviewer?.name}
        />
        <DrawerContentItem
          label="Approver"
          value={chemicalRequest.reviewer?.name}
        />
        <DrawerContentItem
          label="Requested Date"
          value={
            chemicalRequest.requestDate
              ? format(new Date(chemicalRequest.requestDate), "dd/MM/yyyy")
              : "--"
          }
        />
        <DrawerContentItem label="Division" value={chemicalRequest.division} />
        <DrawerContentItem
          label="Requested Customer"
          value={chemicalRequest.requestedCustomer}
        />
        <DrawerContentItem
          label="Requested Merchandiser"
          value={chemicalRequest.requestedMerchandiser}
        />
        {chemicalRequest.status === ChemicalRequestStatus.DRAFT && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: "1rem",
              objectFit: "contain",
            }}
          >
            <CustomButton
              variant="contained"
              sx={{
                backgroundColor: "var(--pallet-blue)",
                marginTop: "1rem",
                marginX: "0.5rem",
              }}
              size="medium"
              disabled={isChemicalRequestApproving}
              endIcon={
                isChemicalRequestApproving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              onClick={() => setApproveDialogOpen(true)}
            >
              Approve Medicine Request
            </CustomButton>
          </Box>
        )}
      </Box>
      {approveDialogOpen && (
        <ApproveConfirmationModal
          open={approveDialogOpen}
          title="Approve Chemical Request Confirmation"
          content={
            <>
              Are you sure you want to approve this chemical request?
              <Alert severity="warning" style={{ marginTop: "1rem" }}>
                This action is not reversible.
              </Alert>
            </>
          }
          handleClose={() => setApproveDialogOpen(false)}
          approveFunc={async () => {
            const { documents, ...rest } = chemicalRequest;
            await approveChemicalRequestMutation({
              data: rest,
            });
          }}
          onSuccess={() => {}}
          handleReject={() => {}}
        />
      )}
    </Stack>
  );
}

export default ViewChemicalRequestContent;
