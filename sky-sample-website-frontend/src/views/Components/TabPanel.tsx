import {
  Alert,
  Autocomplete,
  Box,
  Stack,
  Tab,
  Tabs,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import theme from "../../theme";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import { useMemo, useState } from "react";

import { Controller, useForm } from "react-hook-form";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import ListIcon from "@mui/icons-material/List";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import CustomButton from "../../components/CustomButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DemoClass } from "../../api/DemoClass/demoClass";
import { demoData } from "../../api/componentApi";

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
function TabPanelPage() {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: `Tab Panel` },
  ];

  const {
    register,
    control,
    formState: { errors },
    trigger,
  } = useForm<DemoClass>({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const defaultValues = true;

  const isGeneralDetailsValid = useMemo(() => {
    return !errors.demo1 && !errors.demo2 && !errors.demo5;
  }, [errors.demo1, errors.demo2, errors.demo5]);

  const triggerGeneralDetailsSection = () => {
    trigger(["demo1", "demo2", "demo5"]);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (activeTab === 0) {
      triggerGeneralDetailsSection();
    }
    setActiveTab(newValue);
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
        <PageTitle title="Tab Panel" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>
      <Box>
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" style={{ marginBottom: "1rem" }}>
            Please make sure to fill all the required fields with valid data
          </Alert>
        )}
      </Box>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="secondary"
        TabIndicatorProps={{
          style: {
            backgroundColor: isGeneralDetailsValid
              ? "var(--pallet-blue)"
              : "var(--pallet-red)",
            height: "3px",
          },
        }}
        sx={{
          backgroundColor: "var(--pallet-lighter-grey)",
          color: "var(--pallet-blue)",
          width: "100%",
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
                color: isGeneralDetailsValid
                  ? "var(--pallet-blue)"
                  : "var(--pallet-red)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <TextSnippetIcon fontSize="small" />
              <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                General 01
              </Typography>
              {!isGeneralDetailsValid && (
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
                backgroundColor: "var(--pallet-lighter-grey)",
                color: "var(--pallet-blue)",
                width: "100%",
                display: "flex",
              }}
            >
              <ListIcon fontSize="small" />
              <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                General 02
              </Typography>
            </Box>
          }
          {...a11yProps(1)}
        />
        {defaultValues ? (
          <Tab
            label={
              <Box
                sx={{
                  backgroundColor: "var(--pallet-lighter-grey)",
                  color: "var(--pallet-blue)",
                  width: "100%",
                  display: "flex",
                }}
              >
                <Diversity3Icon fontSize="small" />
                <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                  General 03
                </Typography>
              </Box>
            }
            {...a11yProps(2)}
          />
        ) : null}
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
          <Stack
            gap={1}
            sx={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "var(--surface-bg)",
              flex: { lg: 3, md: 1 },
              borderRadius: "0.3rem",
            }}
          >
            <Controller
              name="demo1"
              control={control}
              {...register("demo1", { required: true })}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  onChange={(event, newValue) => {
                    field.onChange(newValue);
                  }}
                  size="small"
                  options={
                    demoData?.length ? demoData.map((cat) => cat.name) : []
                  }
                  sx={{ flex: 1, margin: "0.5rem" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.demo1}
                      helperText={errors.demo1 && "Required"}
                      label="Demo 1"
                      name="demo1"
                    />
                  )}
                />
              )}
            />
            <TextField
              id="demo2"
              required
              type="text"
              label="Demo 2"
              error={!!errors.demo2}
              helperText={errors.demo2 && "Required"}
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              {...register("demo2", { required: true })}
            />

            <Autocomplete
              {...register("demo5", { required: true })}
              size="small"
              options={
                demoData?.length ? demoData.map((demo) => demo.name) : []
              }
              sx={{ flex: 1, margin: "0.5rem" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  error={!!errors.demo5}
                  helperText={errors.demo5 ? "Required" : ""}
                  label="Demo 5 Without Controller"
                  name="demo5"
                />
              )}
            />
          </Stack>

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
          <Stack
            gap={1}
            sx={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "var(--surface-bg)",
              flex: { lg: 3, md: 1 },
              borderRadius: "0.3rem",
            }}
          >
            <Controller
              name="demo3"
              control={control}
              {...register("demo3", { required: true })}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  onChange={(event, newValue) => {
                    field.onChange(newValue);
                  }}
                  size="small"
                  options={
                    demoData?.length ? demoData.map((cat) => cat.name) : []
                  }
                  sx={{ flex: 1, margin: "0.5rem" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.demo3}
                      helperText={errors.demo3 && "Required"}
                      label="demo 3"
                      name="demo3"
                    />
                  )}
                />
              )}
            />
            <TextField
              id="demo4"
              required
              type="text"
              label="Demo 4"
              error={!!errors.demo4}
              size="small"
              sx={{ flex: 1, margin: "0.5rem" }}
              helperText={errors.demo4 && "Required"}
              {...register("demo4", { required: true })}
            />
          </Stack>

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
          This is Tab Panel 3
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              margin: "0.5rem",
              justifyContent: "flex-end",
              marginTop: "1.2rem",
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
          </Box>
        </Stack>
      </TabPanel>
    </Stack>
  );
}

export default TabPanelPage;
