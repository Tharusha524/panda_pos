import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Box,
  LinearProgress,
  Stack,
  TableFooter,
  TablePagination,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { format } from "date-fns";
import { fetchChemicalTransactionPublished } from "../../api/ChemicalManagement/ChemicalRequestApi";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

function ChemicalRequestTransactionTable() {
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
    { title: "Chemical Transaction" },
  ];

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );

  const { data: chemicalTransaction, isFetching: isChemicalDataFetching } =
    useQuery({
      queryKey: ["chemical-requests-transaction"],
      queryFn: fetchChemicalTransactionPublished,
    });

  const paginatedChemicalTransactionData = useMemo(() => {
    if (!chemicalTransaction) return [];
    if (rowsPerPage === -1) {
      return chemicalTransaction; // If 'All' is selected, return all data
    }
    return chemicalTransaction.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [chemicalTransaction, page, rowsPerPage]);

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
          {isChemicalDataFetching && <LinearProgress sx={{ width: "100%" }} />}
          <Table aria-label="simple table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell align="right">Inventory</TableCell>
                <TableCell align="right">Reference Number</TableCell>
                <TableCell align="right">Transaction Date</TableCell>
                <TableCell align="right">Division</TableCell>
                <TableCell align="right">Authorized Person</TableCell>
                <TableCell align="right">Chemical</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Delivered Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChemicalTransactionData?.length > 0 ? (
                paginatedChemicalTransactionData.map((row) => (
                  <TableRow
                    key={`${row.id}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell component="th" scope="row" align="right">
                      {row?.referenceNumber ?? "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.transactionsRefferenceNumber ?? "--"}
                    </TableCell>

                    <TableCell align="right">
                      {row?.created_at
                        ? format(new Date(row.created_at), "yyyy-MM-dd")
                        : "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.division ?? "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.approvedByUser?.name ?? "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.molecularFormula ?? "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.purchaseAmount ?? "--"}
                    </TableCell>
                    <TableCell component="th" scope="row" align="right">
                      {row?.deliveryQuantity ?? "--"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">
                      No chemical Transaction found
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
                  count={chemicalTransaction?.length ?? 0}
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
    </Stack>
  );
}

export default ChemicalRequestTransactionTable;
