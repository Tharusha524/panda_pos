import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
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
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import { Controller, useForm } from "react-hook-form";
import useIsMobile from "../../customHooks/useIsMobile";
import DateRangePicker from "../../components/DateRangePicker";
import CustomButton from "../../components/CustomButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DashboardCard from "../../components/DashboardCard";
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import React, { useMemo, useState } from "react";
import CircularProgressWithLabel from "../../components/CircularProgress";

import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";

import { yearData } from "../../api/sampleData/consumptionData";
import { useQuery } from "@tanstack/react-query";
import { fetchDivision } from "../../api/divisionApi";
import { dateFormatter } from "../../util/dateFormat.util";
import CustomPieChart from "../../components/CustomPieChart";
import { format } from "date-fns";

import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import {
  fetchChemicalClassification,
  fetchChemicalDashboardAllSummary,
  fetchChemicalHighestStock,
  fetchChemicalInventoryInsights,
  fetchChemicalMonthlyDelivery,
  fetchChemicalMonthlyLatestRecord,
  fetchChemicalStatusSummery,
  fetchChemicalStockAmount,
  fetchChemicalThreshold,
  fetchChemicalTransactionLatestRecord,
  fetchMsdsCount,
} from "../../api/ChemicalManagement/chemicalDashboardApi";
import UpcomingOutlinedIcon from "@mui/icons-material/UpcomingOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import RadialStrokeBarChart from "../../components/RadialStrokedBarChart";

const breadcrumbItems = [
  { title: "Home", href: "/dashboard" },
  { title: "Chemical Management" },
];

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

function a11yProps2(indexTwo: number) {
  return {
    id: `full-width-tab-${indexTwo}`,
    "aria-controls": `full-width-TabPanelTwo-${indexTwo}`,
  };
}

function a11yProps3(indexTwo: number) {
  return {
    id: `full-width-tab-${indexTwo}`,
    "aria-controls": `full-width-TabPanelTwo-${indexTwo}`,
  };
}

function ChemicalDashboard() {
  const { isMobile, isTablet } = useIsMobile();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
    setValue,
  } = useForm();

  const year = watch("year");

  const auditType = watch("auditType");
  const division = watch("division");

  const dateRangeFrom = watch("dateRangeFrom");
  const formattedDateFrom = dateFormatter(dateRangeFrom);

  const dateRangeTo = watch("dateRangeTo");
  const formattedDateTo = dateFormatter(dateRangeTo);

  const [activeTab, setActiveTab] = useState(0);
  const [activeTabTwo, setActiveTabTwo] = useState(0);
  const [activeTabThree, setActiveTabThree] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log("event", event);
    setActiveTab(newValue);
  };

  const handleChangeTabTwo = (
    eventTwo: React.SyntheticEvent,
    newValueTwo: number
  ) => {
    console.log("event", eventTwo);
    setActiveTabTwo(newValueTwo);
  };

  const handleChangeTabThree = (
    eventTwo: React.SyntheticEvent,
    newValueTwo: number
  ) => {
    console.log("event", eventTwo);
    setActiveTabThree(newValueTwo);
  };

  const { data: divisionData, isFetching: isDivisionDataFetching } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivision,
  });

  //Dashboard API
  const {
    data: chemicalStockAmountData,
    refetch: refetchChemicalStockAmount,
    isFetching: isChemicalStockAmountData,
  } = useQuery({
    queryKey: [
      "stock-amount",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalStockAmount(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  const {
    data: chemicalMonthlyDeliveryData,
    refetch: refetchChemicalMonthlyDelivery,
    isFetching: isChemicalMonthlyDeliveryData,
  } = useQuery({
    queryKey: [
      "monthly-delivery",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalMonthlyDelivery(
        formattedDateFrom,
        formattedDateTo,
        division
      ),
    enabled: false,
  });

  const {
    data: chemicalLatestDeliveryData,
    refetch: refetchChemicalMonthlyLatestRecord,
    isFetching: isChemicalLatestDeliveryData,
  } = useQuery({
    queryKey: [
      "latest-record",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalMonthlyLatestRecord(
        formattedDateFrom,
        formattedDateTo,
        division
      ),
    enabled: false,
  });

  const {
    data: chemicalLatestTransactionData,
    refetch: refetchChemicalTransactionLatestRecord,
    isFetching: isChemicalLatestTransactionData,
  } = useQuery({
    queryKey: [
      "latest-transaction-record",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalTransactionLatestRecord(
        formattedDateFrom,
        formattedDateTo,
        division
      ),
    enabled: false,
  });

  const {
    data: chemicalThresholdData,
    refetch: refetchChemicalThreshold,
    isFetching: isChemicalThresholdData,
  } = useQuery({
    queryKey: [
      "chemical-threshold",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalThreshold(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  const {
    data: chemicalHighestData,
    refetch: refetchChemicalHighestStock,
    isFetching: isChemicalHighestData,
  } = useQuery({
    queryKey: [
      "highest-chemical",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalHighestStock(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  const {
    data: chemicalStatusSummeryData,
    refetch: refetchChemicalStatusSummery,
    isFetching: isChemicalStatusSummeryData,
  } = useQuery({
    queryKey: [
      "chemical-status-summery",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalStatusSummery(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  const {
    data: chemicalInsightData,
    refetch: refetchChemicalInventoryInsights,
    isFetching: isChemicalInsightData,
  } = useQuery({
    queryKey: [
      "chemical-insight",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalInventoryInsights(
        formattedDateFrom,
        formattedDateTo,
        division
      ),
    enabled: false,
  });

  const {
    data: chemicalClassificationData,
    refetch: refetchChemicalClassification,
    isFetching: isChemicalClassificationData,
  } = useQuery({
    queryKey: [
      "chemical-classification",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () =>
      fetchChemicalClassification(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  const {
    data: chemicalMsdsData,
    refetch: refetchMsdsCount,
    isFetching: isChemicalMsdsData,
  } = useQuery({
    queryKey: [
      "chemical-msds",
      formattedDateFrom,
      formattedDateTo,
      division,
      auditType,
    ],
    queryFn: () => fetchMsdsCount(formattedDateFrom, formattedDateTo, division),
    enabled: false,
  });

  //Dashboard useMemo
  const chemicalMsdsDataMemo = useMemo(() => {
    return chemicalMsdsData?.percentage || [];
  }, [chemicalMsdsData]);

  const chemicalClassificationHazardTypeSummaryMemo = useMemo(() => {
    return chemicalClassificationData?.hazardTypeSummary || [];
  }, [chemicalClassificationData]);

  const chemicalGhsClassificationHazardTypeSummaryMemo = useMemo(() => {
    return chemicalClassificationData?.ghsClassificationSummary || [];
  }, [chemicalClassificationData]);

  const chemicalZdhcClassificationHazardTypeSummaryMemo = useMemo(() => {
    return chemicalClassificationData?.zdhcLevelSummary || [];
  }, [chemicalClassificationData]);

  const chemicalInsightTopSuppliersDataMemo = useMemo(() => {
    return chemicalInsightData?.topSuppliers || [];
  }, [chemicalInsightData]);
  const chemicalInsightPositiveListDataMemo = useMemo(() => {
    return chemicalInsightData?.positiveList || [];
  }, [chemicalInsightData]);
  const chemicalInsightMsdsListDataMemo = useMemo(() => {
    return chemicalInsightData?.msdsExpiries || [];
  }, [chemicalInsightData]);
  const chemicalInsightChemicalExpiryListDataMemo = useMemo(() => {
    return chemicalInsightData?.chemicalExpiry || [];
  }, [chemicalInsightData]);
  const chemicalInsightCertificateExpiryListDataMemo = useMemo(() => {
    return chemicalInsightData?.certificateExpiry || [];
  }, [chemicalInsightData]);

  const chemicalStatusSummeryDataMemo = useMemo(() => {
    return (
      chemicalStatusSummeryData?.data?.map(
        (item: { status: string; count: number }) => ({
          name: item.status,
          value: item.count,
        })
      ) || []
    );
  }, [chemicalStatusSummeryData]);

  const chemicalHighestDataMemo = useMemo(() => {
    return chemicalHighestData || [];
  }, [chemicalHighestData]);

  const chemicalThresholdDataMemo = useMemo(() => {
    return chemicalThresholdData || [];
  }, [chemicalThresholdData]);
  console.log(chemicalThresholdDataMemo.length);

  const chemicalMonthlyDeliveryDataMemo = useMemo(() => {
    if (
      !chemicalMonthlyDeliveryData ||
      !Array.isArray(chemicalMonthlyDeliveryData.data)
    ) {
      return [];
    }

    const groupedByMonth: Record<string, Record<string, any>> = {};

    chemicalMonthlyDeliveryData.data.forEach((entry) => {
      const { month, chemical, quantity } = entry;

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = { month };
      }

      groupedByMonth[month][chemical] = quantity;
    });

    return Object.values(groupedByMonth);
  }, [chemicalMonthlyDeliveryData]);

  const chemicalKeys = useMemo(() => {
    const set = new Set<string>();
    chemicalMonthlyDeliveryData?.data?.forEach((entry) =>
      set.add(entry.chemical)
    );
    return Array.from(set);
  }, [chemicalMonthlyDeliveryData]);

  const chemicalLatestTransactionDataMemo = useMemo(() => {
    return chemicalLatestTransactionData || [];
  }, [chemicalLatestTransactionData]);

  const chemicalLatestDeliveryDataMemo = useMemo(() => {
    return chemicalLatestDeliveryData || [];
  }, [chemicalLatestDeliveryData]);

  const chemicalStockAmountDataMemo = useMemo(() => {
    return chemicalStockAmountData || {};
  }, [chemicalStockAmountData]);

  //Dashboard All Summary API
  const {
    data: chemicalDashboardSummeryData,
    isFetching: isChemicalDashboardSummeryData,
  } = useQuery({
    queryKey: ["chemical-dashboard-data", new Date().getFullYear()],
    queryFn: () => fetchChemicalDashboardAllSummary(new Date().getFullYear()),
  });

  //Dashboard All Summary useMemo
  const msdsPercentageMemo = useMemo(() => {
    return chemicalDashboardSummeryData?.msdsSummary?.percentage || 0;
  }, [chemicalDashboardSummeryData]);

  console.log("summary", msdsPercentageMemo);

  const chemicalAllStatusSummeryDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.statusSummary?.map(
        (item: { status: string; count: number }) => ({
          name: item.status,
          value: item.count,
        })
      ) || []
    );
  }, [chemicalDashboardSummeryData]);
  console.log(chemicalAllStatusSummeryDataMemo);

  const chemicalAllZdhcClassificationHazardTypeSummaryMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.categoryClassificationSummary
        ?.zdhcLevelSummary || []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalAllClassificationHazardTypeSummaryMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.categoryClassificationSummary
        ?.hazardTypeSummary || []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalAllGhsClassificationHazardTypeSummaryMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.categoryClassificationSummary
        ?.ghsClassificationSummary || []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryTopSuppliersDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.chemicalInventoryInsights?.topSuppliers ||
      []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryPositiveListDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.chemicalInventoryInsights?.positiveList ||
      []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryMsdsExpiriesDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.chemicalInventoryInsights?.msdsExpiries ||
      []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryChemicalExpiryDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.chemicalInventoryInsights?.chemicalExpiry ||
      []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryCertificateExpiryDataMemo = useMemo(() => {
    return (
      chemicalDashboardSummeryData?.chemicalInventoryInsights
        ?.certificateExpiry || []
    );
  }, [chemicalDashboardSummeryData]);

  const chemicalDashboardSummeryDataMemo = useMemo(() => {
    return chemicalDashboardSummeryData || {};
  }, [chemicalDashboardSummeryData]);

  const chemicalAllMonthlyDeliveryDataMemo = useMemo(() => {
    if (
      !chemicalDashboardSummeryData ||
      !Array.isArray(chemicalDashboardSummeryData.monthlyDelivery)
    ) {
      return [];
    }

    const groupedByMonth: Record<string, Record<string, any>> = {};

    chemicalDashboardSummeryData.monthlyDelivery.forEach((entry) => {
      const { month, chemical, quantity } = entry;

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = { month };
      }

      groupedByMonth[month][chemical] = quantity;
    });

    return Object.values(groupedByMonth);
  }, [chemicalDashboardSummeryData]);

  const chemicalAllKeys = useMemo(() => {
    const set = new Set<string>();
    chemicalDashboardSummeryData?.monthlyDelivery?.forEach((entry) =>
      set.add(entry.chemical)
    );
    return Array.from(set);
  }, [chemicalDashboardSummeryData]);

  const chemicalAllThresholdDataMemo = useMemo(() => {
    return chemicalDashboardSummeryData || [];
  }, [chemicalDashboardSummeryData]);

  const chemicalAllHighestDataMemo = useMemo(() => {
    return chemicalDashboardSummeryData || [];
  }, [chemicalDashboardSummeryData]);

  const chemicalAllLatestDeliveryDataMemo = useMemo(() => {
    return chemicalDashboardSummeryData?.latestRecords || [];
  }, [chemicalDashboardSummeryData]);

  const chemicalAllLatestTransactionDataMemo = useMemo(() => {
    return chemicalDashboardSummeryData?.latestTransactions || [];
  }, [chemicalDashboardSummeryData]);

  const handleFetch = () => {
    refetchChemicalStockAmount();
    refetchChemicalMonthlyDelivery();
    refetchChemicalMonthlyLatestRecord();
    refetchChemicalTransactionLatestRecord();
    refetchChemicalThreshold();
    refetchChemicalHighestStock();
    refetchChemicalStatusSummery();
    refetchChemicalInventoryInsights();
    refetchChemicalClassification();
    refetchMsdsCount();
  };

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
        <PageTitle title="Chemical Management Dashboard" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>

      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{
            borderBottom: "1px solid var(--pallet-lighter-grey)",
          }}
        >
          <Typography variant="subtitle2">Dashboard Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flex: 1,
                minWidth: "250px",
              }}
            >
              <Controller
                name="year"
                control={control}
                rules={{ required: true }}
                defaultValue={new Date().getFullYear().toString()}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    onChange={(event, newValue) => field.onChange(newValue)}
                    size="small"
                    options={
                      yearData?.length ? yearData.map((year) => year.year) : []
                    }
                    sx={{ flex: 1, margin: "0.5rem" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={!!errors.year}
                        helperText={errors.year && "Required"}
                        label="Year"
                        name="year"
                      />
                    )}
                  />
                )}
              />
            </Box>
            <DateRangePicker
              control={control}
              register={register}
              errors={errors}
              label="Enter a date Range"
              year={year}
            />

            <Box
              sx={{
                display: "flex",
                flex: 1,
                minWidth: "250px",
              }}
            >
              <Controller
                name="division"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    onChange={(e, value) => field.onChange(value)}
                    value={field.value || ""}
                    options={
                      divisionData?.map((division) => division.divisionName) ||
                      []
                    }
                    size="small"
                    sx={{ flex: 1, margin: "0.5rem" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        error={!!errors.division}
                        helperText={errors.division && "Required"}
                        label="Division"
                      />
                    )}
                  />
                )}
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
              marginX: "0.5rem",
            }}
          >
            <Button
              onClick={() => {
                reset();
              }}
              sx={{ color: "var(--pallet-blue)", marginRight: "0.5rem" }}
            >
              Reset
            </Button>
            <CustomButton
              variant="contained"
              sx={{
                backgroundColor: "var(--pallet-blue)",
              }}
              size="medium"
              onClick={handleSubmit((data) => {
                handleFetch();
                console.log("data", data);
              })}
            >
              Add Filter
            </CustomButton>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginTop: "1rem",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minWidth: "150px",
            margin: "0.5rem",
          }}
        >
          <DashboardCard
            title="In Stock"
            titleIcon={<ScienceOutlinedIcon fontSize="large" />}
            value={
              chemicalStockAmountDataMemo?.inStockCount ||
              0 ||
              chemicalDashboardSummeryDataMemo?.inStockCount ||
              0
            }
            subDescription="Chemicals in Stock"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flex: 1,
            margin: "0.5rem",
            minWidth: "150px",
          }}
        >
          <DashboardCard
            title="Delivered"
            titleIcon={<LocalShippingOutlinedIcon fontSize="large" />}
            value={
              chemicalStockAmountDataMemo?.deliveredTotal ||
              0 ||
              chemicalDashboardSummeryDataMemo?.deliveredTotal ||
              0
            }
            subDescription="Delivered Chemical Quantity"
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flex: 1,
            margin: "0.5rem",
            minWidth: "150px",
          }}
        >
          <DashboardCard
            title="Amount"
            titleIcon={<PaidOutlinedIcon fontSize="large" />}
            value={
              chemicalStockAmountDataMemo?.purchaseAmount ||
              0 ||
              chemicalDashboardSummeryDataMemo?.purchaseAmount ||
              0
            }
            subDescription="Amount Of the Stocked Chemicals"
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "1rem",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "auto",
            marginTop: "1rem",
            flex: 2,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "1rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Delivery Counts By Month
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              height={400}
              data={
                chemicalMonthlyDeliveryDataMemo.length > 0
                  ? chemicalMonthlyDeliveryDataMemo
                  : chemicalAllMonthlyDeliveryDataMemo
              }
            >
              <XAxis dataKey="month" />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {(chemicalMonthlyDeliveryDataMemo.length > 0
                ? chemicalKeys
                : chemicalAllKeys
              ).map((chemical, index) => (
                <Bar
                  key={chemical}
                  dataKey={chemical}
                  barSize={15}
                  stackId="a"
                  fill={
                    ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a0522d"][
                      index % 5
                    ]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flex: 1,
            flexDirection: "column",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
            padding: "1rem",
            height: "auto",
            marginTop: "1rem",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Chemical Inventory Status
            </Typography>
          </Box>
          <ResponsiveContainer
            width="100%"
            height={500}
            style={{
              overflowY: "scroll",
              scrollbarWidth: "none",
            }}
          >
            <>
              <AppBar
                position="sticky"
                sx={{
                  display: "flex",
                  mt: "1rem",
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={handleChange}
                  indicatorColor="secondary"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: "var(--pallet-blue)",
                      height: "3px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  }}
                  sx={{
                    backgroundColor: "var(--pallet-lighter-grey)",
                    color: "var(--pallet-blue)",
                    display: "flex",
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
                        <FilterListOutlinedIcon fontSize="small" />
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Threshold
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
                        <TrendingUpOutlinedIcon fontSize="small" />
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Highest Stock
                        </Typography>
                      </Box>
                    }
                    {...a11yProps(1)}
                  />
                </Tabs>
              </AppBar>
              <TabPanel value={activeTab} index={0} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {chemicalThresholdDataMemo.length != 0
                        ? chemicalThresholdDataMemo?.data?.map(
                            (item, index) => (
                              <>
                                <Box
                                  key={index}
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Box flex={2}>
                                    <Typography
                                      variant="button"
                                      fontSize="1.2rem"
                                    >
                                      {item.chemicalName}
                                    </Typography>
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        color="gray"
                                      >
                                        LIMIT: {item.totalLimit}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box flex={1}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        gap: "3rem",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <CircularProgressWithLabel
                                        size={60}
                                        value={item.percentage}
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                                <Divider />
                              </>
                            )
                          )
                        : chemicalAllThresholdDataMemo?.stockThreshold?.map(
                            (item, index) => (
                              <>
                                <Box
                                  key={index}
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Box flex={2}>
                                    <Typography
                                      variant="button"
                                      fontSize="1.2rem"
                                    >
                                      {item.chemicalName}
                                    </Typography>
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        color="gray"
                                      >
                                        LIMIT: {item.totalLimit}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box flex={1}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        gap: "3rem",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <CircularProgressWithLabel
                                        size={60}
                                        value={item.percentage}
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                                <Divider />
                              </>
                            )
                          )}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTab} index={1} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {chemicalHighestDataMemo.length != 0
                        ? chemicalHighestDataMemo?.data?.map((item, index) => (
                            <>
                              <Box
                                key={index}
                                display="flex"
                                justifyContent="space-between"
                                alignItems={"center"}
                              >
                                <Box flex={2}>
                                  <Typography
                                    variant="button"
                                    fontSize="1.2rem"
                                  >
                                    {item.chemicalName}
                                  </Typography>
                                </Box>
                                <Box flex={1}>
                                  <Typography
                                    variant="caption"
                                    fontSize="1.2rem"
                                    color="gray"
                                  >
                                    {" "}
                                    Total Quantity: {item.totalQuantity}
                                  </Typography>
                                </Box>
                              </Box>
                              <Divider />
                            </>
                          ))
                        : chemicalAllHighestDataMemo?.highestStock?.map(
                            (item, index) => (
                              <>
                                <Box
                                  key={index}
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems={"center"}
                                >
                                  <Box flex={2}>
                                    <Typography
                                      variant="button"
                                      fontSize="1.2rem"
                                    >
                                      {item.chemicalName}
                                    </Typography>
                                  </Box>
                                  <Box flex={1}>
                                    <Typography
                                      variant="caption"
                                      fontSize="1.2rem"
                                      color="gray"
                                    >
                                      {" "}
                                      Total Quantity: {item.totalQuantity}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Divider />
                              </>
                            )
                          )}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "1rem",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "600px",
            overflowY: "auto",
            marginTop: "1rem",
            flex: 2,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "1rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
          }}
        >
          <Box position="static" mb={3}>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Latest Inventory Transaction
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              overflowX: "auto",
              maxWidth: isMobile ? "80vw" : "100%",
            }}
          >
            {isChemicalLatestDeliveryData ? (
              <Box
                width="100%"
                height="400px"
                mt={5}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress sx={{ color: "var(--pallet-light-blue)" }} />
              </Box>
            ) : chemicalLatestTransactionDataMemo ||
              chemicalAllLatestTransactionDataMemo ? (
              <Table>
                <TableHead
                  sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}
                >
                  <TableRow>
                    <TableCell align="left"></TableCell>
                    <TableCell align="left">Reference Number</TableCell>
                    <TableCell align="left">Delivered Date</TableCell>
                    <TableCell align="left">Commercial Name</TableCell>
                    <TableCell align="left">ZDHC level</TableCell>
                    <TableCell align="left">Delivered</TableCell>
                    <TableCell align="left">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dateRangeFrom && dateRangeTo && division
                    ? chemicalLatestTransactionDataMemo
                    : chemicalAllLatestTransactionDataMemo || []
                  ).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell align="left">
                        <UpcomingOutlinedIcon fontSize="small" color="error" />
                      </TableCell>
                      <TableCell align="left">
                        {item.transactionsRefferenceNumber}
                      </TableCell>
                      <TableCell align="left">
                        {new Date(item.deliveryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="left">{item.commercialName}</TableCell>
                      <TableCell align="left">{item.zdhcLevel}</TableCell>
                      <TableCell align="left">
                        {item.deliveryQuantity}
                      </TableCell>
                      <TableCell align="left">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography textAlign="center">
                Please select filters to display data
              </Typography>
            )}
          </TableContainer>
        </Box>
        <Box
          sx={{
            width: "100%",
            height: "auto",
            marginTop: "1rem",
            flex: 1,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "1rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Category & Classification
            </Typography>
          </Box>

          <ResponsiveContainer
            width="100%"
            height={500}
            style={{
              overflowY: "scroll",
              scrollbarWidth: "none",
            }}
          >
            <>
              <AppBar
                position="sticky"
                sx={{
                  display: "flex",
                  mt: "1rem",
                }}
              >
                <Tabs
                  value={activeTabThree}
                  onChange={handleChangeTabThree}
                  indicatorColor="secondary"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: "var(--pallet-blue)",
                      height: "3px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  }}
                  sx={{
                    backgroundColor: "var(--pallet-lighter-grey)",
                    color: "var(--pallet-blue)",
                    display: "flex",
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Hazards
                        </Typography>
                      </Box>
                    }
                    {...a11yProps3(0)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          GHS
                        </Typography>
                      </Box>
                    }
                    {...a11yProps3(1)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          GHS ZDHC Level
                        </Typography>
                      </Box>
                    }
                    {...a11yProps3(2)}
                  />
                </Tabs>
              </AppBar>
              <TabPanel value={activeTabThree} index={0} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalClassificationHazardTypeSummaryMemo
                        : chemicalAllClassificationHazardTypeSummaryMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.hazardType}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Count: {item.count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: "3rem",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CircularProgressWithLabel
                                  size={60}
                                  value={item.percentage}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabThree} index={1} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalGhsClassificationHazardTypeSummaryMemo
                        : chemicalAllGhsClassificationHazardTypeSummaryMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.ghsClassification}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Count: {item.count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: "3rem",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CircularProgressWithLabel
                                  size={60}
                                  value={item.percentage}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabThree} index={2} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalZdhcClassificationHazardTypeSummaryMemo
                        : chemicalAllZdhcClassificationHazardTypeSummaryMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.zdhcLevel}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Count: {item.count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: "3rem",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CircularProgressWithLabel
                                  size={60}
                                  value={item.percentage}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "1rem",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "auto",
            marginTop: "1rem",
            flex: 2,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "1rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Chemical Inventory Insights
            </Typography>
          </Box>

          <ResponsiveContainer
            width="100%"
            height={500}
            style={{
              overflowY: "scroll",
              scrollbarWidth: "none",
            }}
          >
            <>
              <AppBar
                position="sticky"
                sx={{
                  display: "flex",
                  mt: "1rem",
                  maxWidth: isMobile ? 400 : "auto",
                }}
              >
                <Tabs
                  value={activeTabTwo}
                  onChange={handleChangeTabTwo}
                  indicatorColor="secondary"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: "var(--pallet-blue)",
                      height: "3px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  }}
                  sx={{
                    backgroundColor: "var(--pallet-lighter-grey)",
                    color: "var(--pallet-blue)",
                    display: "flex",
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Top Suppliers
                        </Typography>
                      </Box>
                    }
                    {...a11yProps2(0)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Positive List
                        </Typography>
                      </Box>
                    }
                    {...a11yProps2(1)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          MSDS EXpiry
                        </Typography>
                      </Box>
                    }
                    {...a11yProps2(2)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Chemical Expiry
                        </Typography>
                      </Box>
                    }
                    {...a11yProps2(3)}
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
                        <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                          Certificate Expiry
                        </Typography>
                      </Box>
                    }
                    {...a11yProps2(4)}
                  />
                </Tabs>
              </AppBar>
              <TabPanel value={activeTabTwo} index={0} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalInsightTopSuppliersDataMemo
                        : chemicalDashboardSummeryTopSuppliersDataMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.name}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Quantity: {item.totalQuantity}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: "3rem",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CircularProgressWithLabel
                                  size={60}
                                  value={item.percentageOfTotalRecords}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabTwo} index={1} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalInsightPositiveListDataMemo
                        : chemicalDashboardSummeryPositiveListDataMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.positiveList}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Count: {item.count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: "3rem",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CircularProgressWithLabel
                                  size={60}
                                  value={item.percentageOfTotalCertificates}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabTwo} index={2} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalInsightMsdsListDataMemo
                        : chemicalDashboardSummeryMsdsExpiriesDataMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.referenceNumber}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  Inventory Number: {item.inventoryNumber}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.commercialName}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  MSDS Expiry Date:{" "}
                                  {format(
                                    new Date(item.msdsorsdsExpiryDate),
                                    "dd-MMM-yyyy"
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabTwo} index={3} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalInsightChemicalExpiryListDataMemo
                        : chemicalDashboardSummeryChemicalExpiryDataMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                Chemical Name
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  {item.molecularFormula}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Typography variant="button" fontSize="1.2rem">
                                Expiry Date
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  {format(
                                    new Date(item.expiryDate),
                                    "dd-MMM-yyyy"
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel value={activeTabTwo} index={4} dir={theme.direction}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      direction: "row",
                      m: "1rem",
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={4}
                      width={"100%"}
                    >
                      {(dateRangeFrom && dateRangeTo && division
                        ? chemicalInsightCertificateExpiryListDataMemo
                        : chemicalDashboardSummeryCertificateExpiryDataMemo
                      )?.map((item, index) => (
                        <>
                          <Box
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Box flex={2}>
                              <Typography variant="button" fontSize="1.2rem">
                                INV ID: {item.inventoryId}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  {item.testName}
                                </Typography>
                              </Box>
                            </Box>
                            <Box flex={1}>
                              <Typography variant="button" fontSize="1.2rem">
                                {item.positiveList}
                              </Typography>
                              <Box>
                                <Typography variant="caption" color="gray">
                                  {format(
                                    new Date(item.expiryDate),
                                    "dd-MMM-yyyy"
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </>
          </ResponsiveContainer>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flex: 1,
            flexDirection: "column",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
            padding: "1rem",
            height: "auto",
            marginTop: "1rem",
          }}
        >
          <ResponsiveContainer width="100%" height={500}>
            <>
              <CustomPieChart
                data={
                  dateRangeFrom && dateRangeTo && division
                    ? chemicalStatusSummeryDataMemo
                    : chemicalAllStatusSummeryDataMemo
                }
                title="Chemical Status Summary"
                centerLabel="Status"
              />
            </>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "1rem",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "600px",
            overflowY: "auto",
            marginTop: "1rem",
            flex: 2,
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            padding: "1rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
          }}
        >
          <Box position="static" mb={3}>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
              }}
            >
              Latest Inventory Delivery
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              overflowX: "auto",
              maxWidth: isMobile ? "80vw" : "100%",
            }}
          >
            {isChemicalLatestDeliveryData ? (
              <Box
                width="100%"
                height="400px"
                mt={5}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress sx={{ color: "var(--pallet-light-blue)" }} />
              </Box>
            ) : chemicalLatestDeliveryDataMemo ||
              chemicalAllLatestDeliveryDataMemo ? (
              <Table>
                <TableHead
                  sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}
                >
                  <TableRow>
                    <TableCell align="left"></TableCell>
                    <TableCell align="left">Reference Number</TableCell>
                    <TableCell align="left">Delivered Date</TableCell>
                    <TableCell align="left">Commercial Name</TableCell>
                    <TableCell align="left">ZDHC level</TableCell>
                    <TableCell align="left">Delivered</TableCell>
                    <TableCell align="left">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dateRangeFrom && dateRangeTo && division
                    ? chemicalLatestDeliveryDataMemo
                    : chemicalAllLatestDeliveryDataMemo || []
                  ).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell align="left">
                        <UpcomingOutlinedIcon fontSize="small" color="error" />
                      </TableCell>
                      <TableCell align="left">{item.referenceNumber}</TableCell>
                      <TableCell align="left">
                        {new Date(item.deliveryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="left">{item.commercialName}</TableCell>
                      <TableCell align="left">{item.zdhcLevel}</TableCell>
                      <TableCell align="left">
                        {item.deliveryQuantity}
                      </TableCell>
                      <TableCell align="left">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography textAlign="center">
                Please select filters to display data
              </Typography>
            )}
          </TableContainer>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flex: 1,
            flexDirection: "column",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: "0.3rem",
            border: "1px solid var(--pallet-border-blue)",
            padding: "1rem",
            height: "auto",
            marginTop: "1rem",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                mb: 5,
              }}
            >
              MSDS Chemical Percentage
            </Typography>
          </Box>
          <ResponsiveContainer width="100%" height={500}>
            <>
              <RadialStrokeBarChart
                value={
                  dateRangeFrom && dateRangeTo && division
                    ? chemicalMsdsDataMemo
                    : msdsPercentageMemo
                }
                label="MSDS Count"
                size={400}
              />
            </>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Stack>
  );
}

export default ChemicalDashboard;
