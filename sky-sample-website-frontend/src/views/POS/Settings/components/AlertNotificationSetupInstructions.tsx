import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Link as RouterLink } from "react-router";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";

interface OwnerProps {
  variant: "owner";
  companyEmail?: string;
  companyPhone?: string;
}

interface EmployeeProps {
  variant: "employee";
}

type Props = OwnerProps | EmployeeProps;

const cellSx = { py: 1, px: 1.5, fontSize: "0.875rem" };

const OwnerInstructions: React.FC<{ companyEmail?: string; companyPhone?: string }> = ({
  companyEmail,
  companyPhone,
}) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <MenuBookIcon color="primary" />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Setup instructions (company owner)
      </Typography>
    </Box>

    <Alert severity="warning" sx={{ mb: 2 }}>
      Owner receives alerts at company email <strong>{companyEmail || "(not set yet)"}</strong> and phone{" "}
      <strong>{companyPhone || "(not set yet)"}</strong>. Set these in{" "}
      <RouterLink to={`${COMPANY_SETTINGS_BASE}/manage`}>Manage company</RouterLink> first.
    </Alert>

    <Accordion defaultExpanded disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 1 — Set owner email & phone (where alerts arrive)</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Go to <strong>Settings → Company → Manage company</strong> and fill:
        </Typography>
        <Table size="small" sx={{ mb: 1, bgcolor: "var(--surface-bg-alt)" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={cellSx}>Field</TableCell>
              <TableCell sx={cellSx}>Example</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={cellSx}>Email</TableCell>
              <TableCell sx={cellSx}>danushkah755@gmail.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={cellSx}>Phone</TableCell>
              <TableCell sx={cellSx}>94771234567 (country code, no spaces)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary">
          Click Save. All owner alert emails and SMS go to these addresses.
        </Typography>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 2 — Turn ON required switches (on this page)</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li><strong>Enable company alerts</strong> — master ON</li>
          <li><strong>Send to company owner</strong> — owner gets email/SMS</li>
          <li><strong>Send to employees</strong> — staff who opt in also get alerts</li>
          <li><strong>Enable email sending</strong> — required for email alerts</li>
          <li><strong>Enable SMS sending</strong> — required for text alerts</li>
          <li><strong>Daily digest</strong> — one summary at 8:00 AM (optional)</li>
        </Box>
      </AccordionDetails>
    </Accordion>

    <Accordion defaultExpanded disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 3 — Email setup (SMTP) — Gmail example</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Fill the <strong>Email setup (SMTP)</strong> section below like this if you use Gmail:
        </Typography>
        <Table size="small" sx={{ mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={cellSx}>Field in POS</TableCell>
              <TableCell sx={cellSx}>What to enter</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow><TableCell sx={cellSx}>SMTP host</TableCell><TableCell sx={cellSx}>smtp.gmail.com</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>SMTP port</TableCell><TableCell sx={cellSx}>587</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>SMTP username</TableCell><TableCell sx={cellSx}>your full Gmail (e.g. you@gmail.com)</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>SMTP password</TableCell><TableCell sx={cellSx}>Gmail App Password (16 chars) — NOT your normal Gmail password</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>Encryption</TableCell><TableCell sx={cellSx}>TLS</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>From email</TableCell><TableCell sx={cellSx}>Same Gmail address</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>From name</TableCell><TableCell sx={cellSx}>My POS Business</TableCell></TableRow>
          </TableBody>
        </Table>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>How to get Gmail App Password</Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: "text.secondary", fontSize: "0.875rem" }}>
          <li>Open Google Account → Security</li>
          <li>Turn ON 2-Step Verification</li>
          <li>App passwords → Select app: Mail → Generate</li>
          <li>Copy the 16-character password into SMTP password field</li>
        </Box>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 4 — SMS setup (text messages to owner phone)</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Do <strong>not</strong> use fake URLs like https://sms-provider.com/api/send. That is only an example.
        </Alert>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Option A — Test only (no real SMS yet)</Typography>
        <Table size="small" sx={{ mb: 2, bgcolor: "var(--tint-warning-bg)" }}>
          <TableBody>
            <TableRow><TableCell sx={cellSx}>SMS provider</TableCell><TableCell sx={cellSx}>Test mode (log only)</TableCell></TableRow>
            <TableRow><TableCell sx={cellSx}>SMS API URL / key</TableCell><TableCell sx={cellSx}>Leave empty</TableCell></TableRow>
          </TableBody>
        </Table>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Option B — Real SMS (Dialog, Mobitel, TextIt, etc.)</Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: "text.secondary", fontSize: "0.875rem", mb: 2 }}>
          <li>Create an account with an SMS gateway company</li>
          <li>Copy their <strong>API URL</strong> and <strong>API key</strong> from their dashboard</li>
          <li>SMS provider = HTTP API</li>
          <li>Paste URL and key below → Save</li>
        </Box>
        <Typography variant="body2" color="text.secondary">
          The system sends POST JSON: {"{ to, message, api_key }"} to your SMS company URL.
        </Typography>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 5 — Save & test</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li>Click <strong>Save</strong> at the top of this page</li>
          <li>Click <strong>Send test to company email/phone</strong></li>
          <li>Check owner inbox and phone (company email/phone from Step 1)</li>
          <li>If email fails: check Gmail App Password and that From email = username</li>
          <li>If SMS fails: use Test mode first, or verify real API URL/key from SMS company</li>
        </Box>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 6 — Employees receive alerts too</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          You configure sending once (above). Each employee only chooses to receive alerts:
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li><RouterLink to={`${USER_SETTINGS_BASE}/profile`}>Settings → User → Profile</RouterLink> — employee adds email & phone</li>
          <li><RouterLink to="/settings/alert">Settings → Alert → My alerts</RouterLink> — turn ON Receive email / Receive SMS</li>
          <li>Employee clicks Send test to my email/phone</li>
        </Box>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>What alerts are sent?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li>Expired stock</li>
          <li>Expiring soon (within alert period days)</li>
          <li>Low stock (at or below reorder level)</li>
          <li>Oversold items</li>
          <li>Held sales orders</li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          In-app bell icon (top bar) also shows alerts. Daily digest runs at 8:00 AM when enabled.
        </Typography>
      </AccordionDetails>
    </Accordion>
  </Box>
);

const EmployeeInstructions: React.FC = () => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <MenuBookIcon color="primary" />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Setup instructions (employee)
      </Typography>
    </Box>

    <Alert severity="info" sx={{ mb: 2 }}>
      Your company owner sets up email and SMS sending. You only choose whether to receive alerts on{" "}
      <strong>your profile email and phone</strong>.
    </Alert>

    <Accordion defaultExpanded disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 1 — Add your email & phone</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary">
          Go to <RouterLink to={`${USER_SETTINGS_BASE}/profile`}>Settings → User → Profile</RouterLink> and enter
          your email and mobile number. Alerts are delivered to these contacts.
        </Typography>
      </AccordionDetails>
    </Accordion>

    <Accordion defaultExpanded disableGutters sx={{ mb: 1, border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Step 2 — Turn ON receive alerts</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li><strong>Receive email alerts</strong> — ON to get inventory emails</li>
          <li><strong>Receive SMS alerts</strong> — ON to get text messages</li>
          <li><strong>Include me in daily digest</strong> — one summary per day at 8:00 AM</li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Click Save, then <strong>Send test to my email/phone</strong>.
        </Typography>
      </AccordionDetails>
    </Accordion>

    <Accordion disableGutters sx={{ border: "1px solid var(--surface-border)" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>If test fails</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li>Email/SMS not configured by owner → ask owner to complete{" "}
            <RouterLink to={`${COMPANY_SETTINGS_BASE}/notifications`}>Company → Alert notifications</RouterLink>
          </li>
          <li>Missing profile email/phone → update Profile first</li>
          <li>Check the bell icon in the top bar for in-app alerts anytime</li>
        </Box>
      </AccordionDetails>
    </Accordion>
  </Box>
);

const AlertNotificationSetupInstructions: React.FC<Props> = (props) => {
  if (props.variant === "owner") {
    return <OwnerInstructions companyEmail={props.companyEmail} companyPhone={props.companyPhone} />;
  }
  return <EmployeeInstructions />;
};

export default AlertNotificationSetupInstructions;
