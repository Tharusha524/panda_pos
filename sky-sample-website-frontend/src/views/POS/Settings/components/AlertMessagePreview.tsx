import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import { useQuery } from "@tanstack/react-query";
import { getAlertTemplatePreview } from "../../../../api/Settings/alertSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";

const AlertMessagePreview: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["alert-template-preview"],
    queryFn: getAlertTemplatePreview,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Accordion disableGutters sx={{ mb: 2, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Preview email & SMS theme</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sample layout using your app branding. Test send uses the same template with your live inventory
          counts.
        </Typography>

        {isLoading ? (
          <CircularProgress size={24} sx={{ color: "var(--pallet-blue)" }} />
        ) : null}

        {isError ? (
          <Alert severity="error">{getFriendlyErrorMessage(error, "Failed to load preview")}</Alert>
        ) : null}

        {data ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <EmailIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Email subject
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1 }}>
                {data.email_subject}
              </Typography>
              <Box
                sx={{
                  border: "1px solid var(--surface-border)",
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: "var(--surface-bg-alt)",
                }}
              >
                <iframe
                  title="Alert email preview"
                  srcDoc={data.email_html}
                  sandbox=""
                  style={{
                    width: "100%",
                    minHeight: 420,
                    border: 0,
                    display: "block",
                    background: "var(--surface-bg-alt)",
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <SmsIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  SMS text
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "var(--surface-bg)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  maxWidth: 360,
                }}
              >
                {data.sms_body}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {data.sms_body.length} characters (kept under 320 for multi-part SMS)
              </Typography>
            </Box>
          </Box>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
};

export default AlertMessagePreview;
