import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import type {
  MobilePermissionItem,
  MobilePermissionTab,
} from "../../../../api/Settings/rolesApi";

const tabItems = (tab: MobilePermissionTab): MobilePermissionItem[] =>
  tab.groups.flatMap((g) => g.items);

/** Item keys that need `key`, directly or through another item. */
const dependentsOf = (tab: MobilePermissionTab, key: string): string[] => {
  const items = tabItems(tab);
  const found = new Set<string>();
  const walk = (k: string) => {
    for (const item of items) {
      if (item.requires === k && !found.has(item.key)) {
        found.add(item.key);
        walk(item.key);
      }
    }
  };
  walk(key);
  return [...found];
};

const requiredChainOf = (tab: MobilePermissionTab, item: MobilePermissionItem): string[] => {
  const byKey = new Map(tabItems(tab).map((i) => [i.key, i]));
  const chain: string[] = [];
  let next = item.requires ? byKey.get(item.requires) : undefined;
  while (next && !chain.includes(next.key)) {
    chain.push(next.key);
    next = next.requires ? byKey.get(next.requires) : undefined;
  }
  return chain;
};

interface MobilePermissionsEditorProps {
  catalog: MobilePermissionTab[] | undefined;
  isLoading: boolean;
  isError: boolean;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

const MobilePermissionsEditor: React.FC<MobilePermissionsEditorProps> = ({
  catalog,
  isLoading,
  isError,
  selected,
  onChange,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !catalog || catalog.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        Could not load the mobile app permission list. The role's current mobile access will be
        kept unchanged when you save.
      </Alert>
    );
  }

  const update = (fn: (next: Set<string>) => void) => {
    const next = new Set(selected);
    fn(next);
    onChange(next);
  };

  const setTab = (tab: MobilePermissionTab, on: boolean) =>
    update((next) => {
      if (on) {
        next.add(tab.key);
      } else {
        next.delete(tab.key);
        tabItems(tab).forEach((i) => next.delete(i.key));
      }
    });

  const setAll = (tab: MobilePermissionTab, on: boolean) =>
    update((next) => {
      if (on) {
        next.add(tab.key);
        tabItems(tab).forEach((i) => next.add(i.key));
      } else {
        tabItems(tab).forEach((i) => next.delete(i.key));
      }
    });

  const setItem = (tab: MobilePermissionTab, item: MobilePermissionItem, on: boolean) =>
    update((next) => {
      if (on) {
        next.add(tab.key);
        next.add(item.key);
        requiredChainOf(tab, item).forEach((k) => next.add(k));
      } else {
        next.delete(item.key);
        dependentsOf(tab, item.key).forEach((k) => next.delete(k));
      }
    });

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Arranged like the app's bottom bar. Untick a main part to lock it and everything under it —
        the app shows locked parts greyed out with a lock.
      </Typography>
      {catalog.map((tab) => {
        const tabOn = selected.has(tab.key);
        const items = tabItems(tab);
        const onCount = tabOn ? items.filter((i) => selected.has(i.key)).length : 0;
        const allOn = tabOn && onCount === items.length;

        return (
          <Accordion key={tab.key} disableGutters sx={{ mb: 1, "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", pr: 1 }}>
                <Checkbox
                  checked={tabOn}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setTab(tab, e.target.checked)}
                  inputProps={{ "aria-label": `${tab.label} access` }}
                />
                {!tabOn && <LockIcon fontSize="small" color="disabled" />}
                <Typography sx={{ fontWeight: 700, color: tabOn ? "var(--pallet-blue)" : "text.disabled" }}>
                  {tab.label}
                </Typography>
                <Chip
                  size="small"
                  label={tabOn ? `${onCount}/${items.length} features` : "Locked"}
                  color={tabOn ? "primary" : "default"}
                  variant="outlined"
                  sx={{ ml: "auto" }}
                />
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAll(tab, !allOn);
                  }}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {allOn ? "Clear all" : "Select all"}
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {tab.note && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  {tab.note}
                </Alert>
              )}
              {tab.groups.map((group) => (
                <Box key={group.label} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    {group.label}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", pl: 1 }}>
                    {group.items.map((item) => {
                      const blocked = !tabOn || (item.requires ? !selected.has(item.requires) : false);
                      return (
                        <FormControlLabel
                          key={item.key}
                          control={
                            <Checkbox
                              size="small"
                              checked={!blocked && selected.has(item.key)}
                              onChange={(e) => setItem(tab, item, e.target.checked)}
                            />
                          }
                          label={item.label}
                          sx={{
                            pl: item.requires ? 3 : 0,
                            "& .MuiFormControlLabel-label": {
                              color: blocked ? "text.disabled" : undefined,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default MobilePermissionsEditor;
