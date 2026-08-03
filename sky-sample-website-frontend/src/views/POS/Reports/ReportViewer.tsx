import React, { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import PageTitle from "../../../components/PageTitle";
import { fetchReport, type ReportData } from "../../../api/reportsApi";
import { getCompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import { downloadReportAsPdf } from "../../../utils/exportReportPdf";
import ReportFilters, {
  defaultReportFilters,
  filtersToParams,
  type ReportFilterValues,
} from "./ReportFilters";
import { findCategory, findReport } from "./reportDefinitions";
import SalesSummaryReportView from "./SalesSummaryReportView";
import ReportTableView from "./ReportTableView";

const ReportViewer: React.FC = () => {
  const { categoryId = "", reportKey = "" } = useParams();
  const navigate = useNavigate();
  const reportMeta = findReport(categoryId, reportKey);
  const categoryMeta = findCategory(categoryId);

  const [filters, setFilters] = useState<ReportFilterValues>(defaultReportFilters);
  const [applied, setApplied] = useState(filtersToParams(defaultReportFilters()));
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { data: printHeader } = useQuery({
    queryKey: ["company-print-header"],
    queryFn: getCompanyPrintHeader,
  });

  const {
    data: report,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ReportData>({
    queryKey: ["report", reportKey, applied],
    queryFn: () => fetchReport(reportKey, applied),
    enabled: Boolean(reportKey),
  });

  const handleApply = useCallback(() => {
    setApplied(filtersToParams(filters));
  }, [filters]);

  const paginationResetKey = `${reportKey}-${applied.dateFrom}-${applied.dateTo}-${applied.location ?? "all"}`;

  const handlePdf = () => {
    if (!printHeader) {
      setPdfError("Load company details in Settings before exporting PDF.");
      return;
    }
    if (!report) return;
    setPdfError(null);
    downloadReportAsPdf(printHeader, report);
  };

  if (!reportMeta || !categoryMeta) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Report not found.</Alert>
        <Button sx={{ mt: 2 }} component={RouterLink} to="/reports">
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/reports/${categoryId}`)}
        sx={{ mb: 2 }}
      >
        Back to {categoryMeta.title}
      </Button>

      <PageTitle
        title={reportMeta.title}
        subtitle={`${categoryMeta.title} · Live data from your POS`}
      />

      <ReportFilters
        values={filters}
        onChange={setFilters}
        onApply={handleApply}
        loading={isLoading || isFetching}
      />

      <Chip
        icon={<StorefrontIcon />}
        label={`Branch: ${
          report?.filters.branch_name ??
          (filters.location === "all" ? "All branches" : filters.location)
        }`}
        color="primary"
        variant="outlined"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePdf}
          disabled={!report || !printHeader}
        >
          Download PDF
        </Button>
        {pdfError && (
          <Alert severity="warning" sx={{ flex: "1 1 100%" }}>
            {pdfError}
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { message?: string }).message ?? "Failed to load report"}
        </Alert>
      )}

      {(isLoading || isFetching) && !report ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : report ? (
        <>
          {report.note && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {report.note}
            </Alert>
          )}

          {report.summary.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {report.summary.map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.label}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6">{formatCell(item.value)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {report.filters.date_from} — {report.filters.date_to} ·{" "}
            {report.filters.branch_name} · Updated{" "}
            {format(new Date(report.generated_at), "dd MMM yyyy HH:mm")}
          </Typography>

          {report.layout === "sales_summary" ? (
            <SalesSummaryReportView report={report} resetKey={paginationResetKey} />
          ) : (
            <ReportTableView report={report} resetKey={paginationResetKey} />
          )}
        </>
      ) : null}
    </Box>
  );
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? String(value)
      : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value);
}

export default ReportViewer;
