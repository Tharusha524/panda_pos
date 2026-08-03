import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TableFooter,
  TablePagination,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import {
  ChemicalRequest,
  ChemicalRequestStatus,
  deleteChemicalRequest,
  fetchChemicalAssignedRequest,
  fetchChemicalRequests,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import ViewDataDrawer, { DrawerHeader } from "../../components/ViewDataDrawer";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import ViewChemicalRequestContent from "./ViewChemicalRequestContent";
import AddOrEditChemicalRequestDialog from "./AddOrEditChemicalRequestDialog";
import CustomButton from "../../components/CustomButton";
import ApproveConfirmationModal from "../../components/ApproveConfirmationModal";
import { useMutation, useQuery } from "@tanstack/react-query";
import queryClient from "../../state/queryClient";
import useCurrentUserHaveAccess from "../../hooks/useCurrentUserHaveAccess";
import { PermissionKeys } from "../Administration/SectionList";

function ChemicalRequestTable({
  isAssignedTasks,
}: {
  isAssignedTasks: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [openViewDrawer, setOpenViewDrawer] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ChemicalRequest>(null);
  const [openAddOrEditDialog, setOpenAddOrEditDialog] = useState(false);
  // const [chemicalRequests, setChemicalRequests] = useState<ChemicalRequest[]>(
  //   sampleChemicalRequestData
  // );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: `${isAssignedTasks ? "Assigned " : ""}Chemical Management` },
  ];

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );

  const { data: chemicalRequests, isFetching: isChemicalDataFetching } =
    useQuery({
      queryKey: ["chemical-requests"],
      queryFn: fetchChemicalRequests,
    });

  const {
    data: chemicalRequestsAssignedData,
    isFetching: isChemicalAssignedDataFetching,
  } = useQuery({
    queryKey: ["chemical-requests-assigned"],
    queryFn: fetchChemicalAssignedRequest,
  });

  const { mutate: deleteChemicalRequestMutation, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteChemicalRequest,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["chemical-requests"],
        });
        enqueueSnackbar("Chemical Request Deleted Successfully!", {
          variant: "success",
        });
        setSelectedRow(null);
        setDeleteDialogOpen(false);
        setOpenViewDrawer(false);
      },
      onError: () => {
        enqueueSnackbar(`Chemical Request Delete Failed`, {
          variant: "error",
        });
      },
    });

  const paginatedChemicalRequestData = useMemo(() => {
    if (isAssignedTasks) {
      if (!chemicalRequestsAssignedData) return [];
      if (rowsPerPage === -1) {
        return chemicalRequestsAssignedData; // If 'All' is selected, return all data
      }
      return chemicalRequestsAssignedData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    } else {
      if (!chemicalRequests) return [];
      if (rowsPerPage === -1) {
        return chemicalRequests; // If 'All' is selected, return all data
      }
      return chemicalRequests.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    }
  }, [
    isAssignedTasks,
    chemicalRequestsAssignedData,
    page,
    rowsPerPage,
    chemicalRequests,
  ]);
  const isCreateDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_REQUEST_REGISTER_CREATE
  );
  const isAssignedCreateDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_ASSIGNED_TASKS_CREATE
  );

  const isEditDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_REQUEST_REGISTER_EDIT
  );
  const isAssignedEditDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_ASSIGNED_TASKS_EDIT
  );

  const isDeleteDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_REQUEST_REGISTER_DELETE
  );
  const isAssignedDeleteDisabled = !useCurrentUserHaveAccess(
    PermissionKeys.CHEMICAL_MNG_ASSIGNED_TASKS_DELETE
  );

  return (
    <Stack>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          overflowX: "hidden",
        }}
      >
        <PageTitle title="Chemical Management" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
      <Stack sx={{ alignItems: "center" }}>
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
                setSelectedRow(null);
                setOpenAddOrEditDialog(true);
              }}
              disabled={
                isAssignedTasks ? isAssignedCreateDisabled : isCreateDisabled
              }
            >
              Add New Chemical Request
            </Button>
          </Box>
          {(isChemicalDataFetching || isDeleting) && (
            <LinearProgress sx={{ width: "100%" }} />
          )}
          <Table aria-label="simple table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Reference Number</TableCell>
                <TableCell align="right">Request Date</TableCell>
                <TableCell align="right">Commercial Name</TableCell>
                <TableCell align="right">Substance Name</TableCell>
                <TableCell align="right">Division</TableCell>
                <TableCell align="right">Customer</TableCell>
                <TableCell align="right">Merchandiser</TableCell>
                <TableCell align="right">Reviewer</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChemicalRequestData?.length > 0 ? (
                paginatedChemicalRequestData.map((row) => (
                  <TableRow
                    key={`${row.id}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedRow(row);
                      setOpenViewDrawer(true);
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {row.referenceNumber}
                    </TableCell>
                    <TableCell align="right">
                      {row?.requestDate
                        ? format(new Date(row.requestDate), "yyyy-MM-dd")
                        : "--"}
                    </TableCell>
                    <TableCell align="right">{row.commercialName}</TableCell>
                    <TableCell align="right">{row.substanceName}</TableCell>
                    <TableCell align="right">{row?.division ?? "--"}</TableCell>
                    <TableCell align="right">
                      {row?.requestedCustomer ?? "--"}
                    </TableCell>
                    <TableCell align="right">
                      {row?.requestedMerchandiser ?? "--"}
                    </TableCell>
                    <TableCell align="right">
                      {row?.reviewer?.name ?? "--"}
                    </TableCell>
                    <TableCell align="right">
                      {row.status === ChemicalRequestStatus.DRAFT ? (
                        <Chip label="Draft" />
                      ) : (
                        <Chip
                          label="Approved"
                          sx={{
                            backgroundColor: "var(--pallet-blue)",
                            color: "white",
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">
                      No chemical Purchase found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={100}
                  count={
                    isAssignedTasks
                      ? chemicalRequestsAssignedData?.length
                      : chemicalRequests?.length
                  }
                  rowsPerPage={rowsPerPage}
                  page={page}
                  showFirstButton={true}
                  showLastButton={true}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Stack>
      <ViewDataDrawer
        open={openViewDrawer}
        fullScreen={true}
        handleClose={() => setOpenViewDrawer(false)}
        drawerContent={
          <Stack spacing={1} sx={{ paddingX: theme.spacing(1) }}>
            <DrawerHeader
              title="Chemical Request Details"
              handleClose={() => setOpenViewDrawer(false)}
              onEdit={() => {
                setSelectedRow(selectedRow);
                setOpenAddOrEditDialog(true);
              }}
              disableEdit={
                selectedRow?.status !== ChemicalRequestStatus.DRAFT ||
                (isAssignedTasks ? isAssignedEditDisabled : isEditDisabled)
              }
              onDelete={() => setDeleteDialogOpen(true)}
              disableDelete={
                isAssignedTasks ? isAssignedDeleteDisabled : isDeleteDisabled
              }
            />

            {selectedRow && (
              <Stack>
                <ViewChemicalRequestContent
                  chemicalRequest={selectedRow}
                  handleCloseViewDrawer={() => {
                    setOpenViewDrawer(false);
                    setSelectedRow(null);
                  }}
                />
              </Stack>
            )}
          </Stack>
        }
      />
      {openAddOrEditDialog && (
        <AddOrEditChemicalRequestDialog
          open={openAddOrEditDialog}
          handleClose={() => {
            setSelectedRow(null);
            setOpenViewDrawer(false);
            setOpenAddOrEditDialog(false);
          }}
          defaultValues={selectedRow}
        />
      )}
      {deleteDialogOpen && (
        <DeleteConfirmationModal
          open={deleteDialogOpen}
          title="Remove Chemical Request Confirmation"
          content={
            <>
              Are you sure you want to remove this chemical request?
              <Alert severity="warning" style={{ marginTop: "1rem" }}>
                This action is not reversible.
              </Alert>
            </>
          }
          handleClose={() => setDeleteDialogOpen(false)}
          deleteFunc={async () => {
            deleteChemicalRequestMutation(selectedRow.id);
            setDeleteDialogOpen(false);
            setOpenViewDrawer(false);
          }}
          onSuccess={() => {}}
          handleReject={() => {}}
        />
      )}
    </Stack>
  );
}

export default ChemicalRequestTable;
