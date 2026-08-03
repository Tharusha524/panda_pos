import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DeleteIcon from "@mui/icons-material/Delete";
import { MedicineInventory } from "../../api/OccupationalHealth/medicineInventoryApi";
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import useIsMobile from "../../customHooks/useIsMobile";
import theme from "../../theme";
import {
  ChemicalCertificate,
  ChemicalPurchaseRequest,
} from "../../api/ChemicalManagement/ChemicalRequestApi";
import { FileItemsViewer } from "../../components/FileItemsViewer";
import { StorageFile } from "../../utils/StorageFiles.util";
import { format } from "date-fns";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ViewCertificateDialog from "./ViewCertificateDialog";

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

function ViewChemicalPurchaseInventoryContent({
  chemicalRequest,
}: {
  chemicalRequest: ChemicalPurchaseRequest;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const { isTablet } = useIsMobile();
  console.log(chemicalRequest);

  const [certificateViewDialogOpen, setCertificateViewDialogOpen] =
    useState(false);
  const [selectedViewCertificate, setSelectedViewCertificate] =
    useState<ChemicalCertificate | null>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
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
            label="Reference"
            value={chemicalRequest.referenceNumber}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Reported Date"
            value={new Date(chemicalRequest?.requestDate).toDateString()}
            sx={{ flex: 1 }}
          />
        </Box>
        <AppBar position="static">
          <Tabs
            value={activeTab}
            onChange={handleChange}
            indicatorColor="secondary"
            TabIndicatorProps={{
              style: { backgroundColor: "var(--pallet-blue)", height: "3px" },
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
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <TextSnippetIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Chemical Details
                  </Typography>
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Box
                  sx={{
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <LocalShippingIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Supplier Details
                  </Typography>
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Box
                  sx={{
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ReceiptLongIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Purchase Details
                  </Typography>
                </Box>
              }
              {...a11yProps(2)}
            />
            <Tab
              label={
                <Box
                  sx={{
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ApartmentIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Storage & Usage
                  </Typography>
                </Box>
              }
              {...a11yProps(3)}
            />
            <Tab
              label={
                <Box
                  sx={{
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <DeleteIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Certificated/Test
                  </Typography>
                </Box>
              }
              {...a11yProps(4)}
            />
          </Tabs>
        </AppBar>
        <TabPanel value={activeTab} index={0} dir={theme.direction}>
          <Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
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
                label="Chemical Form Type"
                value={chemicalRequest.chemicalFormType}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Reach Registration Number"
                value={chemicalRequest.reachRegistrationNumber}
                sx={{ flex: 1 }}
              />
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
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Product Standard"
                value={chemicalRequest.productStandard}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="ZDHC use category"
                value={chemicalRequest.zdhcCategory}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Where and whyit is used"
                value={chemicalRequest.whereAndWhyUse}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={1} dir={theme.direction}>
          <Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Type"
                value={chemicalRequest.type}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Name"
                value={chemicalRequest.name}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Manufacturer Name"
                value={chemicalRequest.manufactureName}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Contact Number"
                value={chemicalRequest.contactNumber}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Email"
                value={chemicalRequest.emailId}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Location/Country"
                value={chemicalRequest.location}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="ZDHC Level"
                value={chemicalRequest.zdhcLevel}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="ZCAS Number"
                value={chemicalRequest.casNumber}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Colour Index"
                value={chemicalRequest.colourIndex}
                sx={{ flex: 1 }}
              />
            </Box>
            <DrawerContentItem
              label="Do you have and MSDS/SDS?"
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
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
                marginY: "1rem",
              }}
            >
              <DrawerContentItem
                label="Complaint with the latest version of ZDHC and MRSL?"
                value={
                  chemicalRequest.compliantWithTheLatestVersionOfZDHCandMRSL
                }
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="APEO/NPE free compliance statement?"
                value={chemicalRequest.apeoOrNpeFreeComplianceStatement}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={2} dir={theme.direction}>
          <Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Manufacturing Date"
                value={new Date(
                  chemicalRequest.manufacturingDate
                ).toDateString()}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Expiry Date"
                value={new Date(chemicalRequest.expiryDate)?.toDateString()}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Delivery Date"
                value={new Date(chemicalRequest.deliveryDate)?.toDateString()}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Delivered Quantity"
                value={new Date(
                  chemicalRequest.deliveryQuantity
                )?.toDateString()}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Delivered Unit"
                value={chemicalRequest.deliveryUnit}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Purchased Amount"
                value={chemicalRequest.purchaseAmount}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <DrawerContentItem
                label="Threshold Limit"
                value={chemicalRequest.thresholdLimit}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Invoice Date"
                value={new Date(chemicalRequest.invoiceDate).toDateString()}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Invoice Reference"
                value={chemicalRequest.invoiceReference}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={3} dir={theme.direction}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {/* <DrawerContentItem
              label="Use of PPE"
              value={chemicalRequest.useOfPPE}
              sx={{ flex: 1 }}
            /> */}
            {/* <DrawerContentItem
              label="Hazard Type"
              value={chemicalRequest.hazardType}
              sx={{ flex: 1 }}
            /> */}
            <DrawerContentItem
              label="GHS Classification"
              value={chemicalRequest.ghsClassification}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="Hazard Statement Codes"
              value={chemicalRequest.hazardStatement}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="Storage Condition Requirement"
              value={chemicalRequest.storageConditionRequirements}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="Storage Place"
              value={chemicalRequest.storagePlace}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="LOT Number"
              value={chemicalRequest.lotNumber}
              sx={{ flex: 1 }}
            />
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={4} dir={theme.direction}>
          <Table aria-label="activity stream table">
            <TableHead
              sx={{
                backgroundColor: "var(--pallet-lighter-grey)",
              }}
            >
              <TableRow>
                <TableCell align="left">Name</TableCell>
                <TableCell align="left">Test Date</TableCell>
                <TableCell align="left">Testing Lab</TableCell>
                <TableCell align="left">Issued Date</TableCell>
                <TableCell align="left">Expiry Date</TableCell>
                <TableCell align="left"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chemicalRequest?.certificate?.length > 0 ? (
                chemicalRequest?.certificate.map((row) => (
                  <TableRow
                    key={`${row.id}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell align="left" component="th" scope="row">
                      {row.testName}
                    </TableCell>
                    <TableCell align="left">
                      {row?.testDate
                        ? format(new Date(row.testDate), "yyyy-MM-dd")
                        : "--"}
                    </TableCell>
                    <TableCell align="left">{row.testLab}</TableCell>
                    <TableCell align="left">
                      {row?.issuedDate
                        ? format(new Date(row.issuedDate), "yyyy-MM-dd")
                        : "--"}
                    </TableCell>
                    <TableCell align="left">
                      {row?.expiryDate
                        ? format(new Date(row.expiryDate), "yyyy-MM-dd")
                        : "--"}
                    </TableCell>
                    <TableCell align="left">
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
                  <TableCell colSpan={11} align="left">
                    <Typography variant="body2">No Disposals found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        <Typography
          variant="caption"
          sx={{ marginLeft: "0.5rem", color: "var(--pallet-grey)" }}
        >
          Status
        </Typography>
        <Box>
          {chemicalRequest.status === "approved" ? (
            <Chip label="Request Approved" />
          ) : chemicalRequest.status === "published" ? (
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
        <DrawerContentItem
          label="Created By"
          value={chemicalRequest.createdByUser?.name}
        />
        <DrawerContentItem
          label="Approved By"
          value={chemicalRequest.approverName?.name}
        />
        <DrawerContentItem
          label="Requested Date"
          value={new Date(chemicalRequest.requestDate)?.toDateString()}
          sx={{ flex: 1 }}
        />
        <DrawerContentItem
          label="Requested Customer"
          value={chemicalRequest.requestedCustomer}
        />
        <DrawerContentItem label="Division" value={chemicalRequest.division} />
      </Box>
      <ViewCertificateDialog
        open={certificateViewDialogOpen}
        onClose={() => setCertificateViewDialogOpen(false)}
        defaultValues={selectedViewCertificate}
      />
    </Stack>
  );
}

export default ViewChemicalPurchaseInventoryContent;
