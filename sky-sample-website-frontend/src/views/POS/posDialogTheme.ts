/** Shared POS modal sizing and blue accent (use instead of green). */
export const POS_DIALOG_PAPER_SX = {
  "& .MuiDialog-paper": {
    width: "100%",
    maxWidth: { xs: "96vw", sm: 520, md: 600 },
    minHeight: 280,
    maxHeight: "90vh",
    m: 2,
  },
};

export const POS_PRIMARY_BUTTON_SX = {
  bgcolor: "var(--pallet-blue)",
  "&:hover": { bgcolor: "var(--pallet-main-blue)" },
};

export const POS_RADIO_SX = {
  color: "var(--pallet-blue)",
  "&.Mui-checked": { color: "var(--pallet-blue)" },
};

export const POS_SELECT_MENU_PROPS = {
  PaperProps: {
    sx: { maxHeight: 320 },
  },
};

/** Slightly larger modal for category add/edit forms. */
export const CATEGORY_DIALOG_PAPER_SX = {
  "& .MuiDialog-paper": {
    width: "100%",
    maxWidth: { xs: "96vw", sm: 560, md: 680, lg: 720 },
    minHeight: 320,
    maxHeight: "92vh",
    m: 2,
  },
};
