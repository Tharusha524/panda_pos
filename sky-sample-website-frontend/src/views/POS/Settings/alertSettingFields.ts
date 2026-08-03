import type { AlertSettings } from "../../../api/Settings/alertSettingsApi";

export type AlertNumberFieldKey = keyof Pick<
  AlertSettings,
  "expiry_alert_period_days" | "cheque_alert_period_days"
>;

export interface AlertNumberFieldDef {
  key: AlertNumberFieldKey;
  title: string;
  description: string;
}

export const ALERT_NUMBER_FIELDS: AlertNumberFieldDef[] = [
  {
    key: "expiry_alert_period_days",
    title: "Expiry alert period day(s)",
    description:
      "Notice of expired items can be obtained by setting the period in days.",
  },
  {
    key: "cheque_alert_period_days",
    title: "Cheque alert period day(s)",
    description:
      "Notice of expired Cheque can be obtained by setting the period in days.",
  },
];
