import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import type { CompanyPrintHeader } from "../api/Settings/companySettingsApi";

interface ReportPrintHeaderProps {
  header: CompanyPrintHeader;
  reportTitle?: string;
  reportSubtitle?: string;
}

const ReportPrintHeader: React.FC<ReportPrintHeaderProps> = ({
  header,
  reportTitle,
  reportSubtitle,
}) => {
  const contactLine = [header.email, header.phone].filter(Boolean).join("  |  ");

  return (
    <Box className="report-print-header" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {header.logo_url && (
          <Box
            component="img"
            src={header.logo_url}
            alt={`${header.company_name} logo`}
            sx={{
              height: 72,
              maxWidth: 140,
              objectFit: "contain",
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "var(--pallet-blue)", lineHeight: 1.2 }}
          >
            {header.company_name}
          </Typography>
          {header.address_line && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {header.address_line}
            </Typography>
          )}
          {contactLine && (
            <Typography variant="body2" color="text.secondary">
              {contactLine}
            </Typography>
          )}
          {(header.tax_id || header.registration_number) && (
            <Typography variant="caption" color="text.secondary" display="block">
              {[header.tax_id && `Tax ID: ${header.tax_id}`, header.registration_number && `Reg: ${header.registration_number}`]
                .filter(Boolean)
                .join("  |  ")}
            </Typography>
          )}
        </Box>
      </Box>
      {reportTitle && (
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
          {reportTitle}
        </Typography>
      )}
      {reportSubtitle && (
        <Typography variant="body2" color="text.secondary">
          {reportSubtitle}
        </Typography>
      )}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default ReportPrintHeader;
