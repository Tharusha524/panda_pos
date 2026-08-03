export const POS_PAYMENT_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "Card", label: "Card" },
  { value: "Credit", label: "Credit" },
  { value: "Online", label: "Online Payment" },
] as const;

export type PosPaymentMethod = (typeof POS_PAYMENT_OPTIONS)[number]["value"];

export const boxTileSx = {
  p: 2,
  minHeight: 88,
  border: "2px solid var(--surface-border)",
  borderRadius: 2,
  bgcolor: "var(--surface-bg)",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  transition: "border-color 0.15s, box-shadow 0.15s",
  "&:hover": {
    borderColor: "var(--pallet-blue)",
    boxShadow: "0 2px 8px rgba(0,50,126,0.12)",
  },
};

export const boxTileSelectedSx = {
  ...boxTileSx,
  borderColor: "var(--pallet-blue)",
  bgcolor: "var(--surface-bg-alt)",
  boxShadow: "0 2px 10px rgba(0,50,126,0.18)",
};

export const boxTileOutOfStockSx = {
  ...boxTileSx,
  opacity: 0.65,
  cursor: "not-allowed",
  bgcolor: "var(--surface-bg-alt)",
  borderColor: "#e57373",
  "&:hover": {
    borderColor: "#e57373",
    boxShadow: "none",
  },
};
