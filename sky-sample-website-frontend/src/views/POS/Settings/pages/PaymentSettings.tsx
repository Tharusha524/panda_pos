import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsSelectRow from "../components/SettingsSelectRow";
import { SettingsTextRow } from "../components/SettingsSelectRow";
import {
  getOrderSettings,
  updateOrderSettings,
  type DefaultPaymentMethod,
  type OrderSettingsPayload,
} from "../../../../api/Settings/orderSettingsApi";
import {
  getCompanySettings,
  updateCompanyLocale,
} from "../../../../api/Settings/companySettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../../utils/invalidatePosRuntimeSettings";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";
import { PAYMENT_METHOD_OPTIONS } from "../orderSettingFields";

const CURRENCY_OPTIONS = [
  { value: "LKR", label: "LKR - Sri Lankan Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
];

const PaymentSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState("LKR");
  const [language, setLanguage] = useState("en");
  const [orderForm, setOrderForm] = useState<OrderSettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const companyQuery = useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
  });

  const orderQuery = useQuery({
    queryKey: ["order-settings"],
    queryFn: getOrderSettings,
  });

  useEffect(() => {
    if (companyQuery.data) {
      setCurrency(companyQuery.data.currency ?? "LKR");
      setLanguage(companyQuery.data.language ?? "en");
    }
  }, [companyQuery.data]);

  useEffect(() => {
    if (orderQuery.data) {
      const { id: _id, ...settings } = orderQuery.data;
      setOrderForm(settings);
    }
  }, [orderQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateCompanyLocale({ currency, language });
      return updateOrderSettings({
        default_payment_method: orderForm.default_payment_method,
        credit_debit_card_payment_charges_percent:
          orderForm.credit_debit_card_payment_charges_percent,
        allow_customer_advance_payment: orderForm.allow_customer_advance_payment,
      });
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["order-settings"], updatedOrder);
      void companyQuery.refetch();
      invalidatePosRuntimeSettings(queryClient);
      setSaveError(null);
      setSaveMessage("Payment settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save payment settings"));
    },
  });

  const isLoading = companyQuery.isLoading || orderQuery.isLoading;
  const isError = companyQuery.isError || orderQuery.isError;
  const loadError = companyQuery.error ?? orderQuery.error;

  if (isLoading) {
    return (
      <SettingsPageShell title="Payment" subtitle="Currency and payment methods" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Payment" subtitle="Currency and payment methods" wide hideSave>
        <Alert severity="error">
          {getFriendlyErrorMessage(loadError, "Failed to load payment settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Payment"
      subtitle="Currency and payment methods"
      wide
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
    >
      {saveMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {saveMessage}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}>
        Currency
      </Typography>
      <SettingsSelectRow
        title="Default currency"
        description="Used on receipts and reports."
        value={currency}
        options={CURRENCY_OPTIONS}
        onChange={setCurrency}
        disabled={saveMutation.isPending}
      />

      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 1.5, mt: 2, color: "var(--pallet-blue)" }}
      >
        Payment methods
      </Typography>
      <SettingsSelectRow
        title="Default payment method"
        description="Pre-selected at POS checkout."
        value={orderForm.default_payment_method ?? "cash"}
        options={PAYMENT_METHOD_OPTIONS}
        onChange={(v) =>
          setOrderForm((prev) => ({
            ...prev,
            default_payment_method: v as DefaultPaymentMethod,
          }))
        }
        disabled={saveMutation.isPending}
      />
      <SettingsTextRow
        title="Card payment charge"
        description="Percentage added when customer pays by card."
        type="number"
        value={String(orderForm.credit_debit_card_payment_charges_percent ?? 0)}
        onChange={(v) =>
          setOrderForm((prev) => ({
            ...prev,
            credit_debit_card_payment_charges_percent: parseFloat(v) || 0,
          }))
        }
        endAdornment="%"
        disabled={saveMutation.isPending}
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        VAT and tax rules are on the{" "}
        <Button
          component={RouterLink}
          to={`${SETTINGS_BASE_PATH}/tax`}
          size="small"
          sx={{ textTransform: "none", p: 0, minWidth: 0, verticalAlign: "baseline" }}
        >
          Tax settings
        </Button>{" "}
        page. More sales-screen options are under{" "}
        <Button
          component={RouterLink}
          to={`${SETTINGS_BASE_PATH}/order`}
          size="small"
          sx={{ textTransform: "none", p: 0, minWidth: 0, verticalAlign: "baseline" }}
        >
          Order settings
        </Button>
        .
      </Alert>
    </SettingsPageShell>
  );
};

export default PaymentSettings;
