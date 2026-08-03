import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../components/PageTitle";
import { getOffers, type Offer } from "../../api/offersApi";
import { resolveStorageUrl } from "../../utils/resolveStorageUrl";
import { getFriendlyErrorMessage } from "../../utils/getFriendlyErrorMessage";

export type OfferFilterType = "all" | "product" | "order";

const FILTER_OPTIONS: { value: OfferFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "product", label: "Product" },
  { value: "order", label: "Order" },
];

function statusColor(status: string): string {
  return status === "Active" ? "#c8e6c9" : "#ffcdd2";
}

const OffersList: React.FC = () => {
  const [filter, setFilter] = useState<OfferFilterType>("all");

  const { data: offersResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["offers", filter],
    queryFn: () => getOffers(filter === "all" ? undefined : filter),
  });

  const offers = offersResponse?.offers ?? [];

  const filteredOffers = useMemo(() => {
    if (filter === "all") return offers;
    return offers.filter((o) => o.discount_type === filter);
  }, [offers, filter]);

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <PageTitle title="Offers" subtitle="Manage promotional offers" />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            component={Link}
            to="/offers/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Create Offer
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            onClick={() => setFilter(opt.value)}
            color={filter === opt.value ? "primary" : "default"}
            variant={filter === opt.value ? "filled" : "outlined"}
            sx={{
              fontWeight: filter === opt.value ? 600 : 400,
              ...(filter === opt.value && {
                bgcolor: "var(--pallet-blue)",
                color: "#fff",
              }),
            }}
          />
        ))}
      </Box>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load offers")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", width: "100%" }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Offer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Offer Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Image
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No {filter === "all" ? "" : filter} offers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer: Offer) => (
                <TableRow key={offer.id} hover>
                  <TableCell>{offer.created_at_display ?? "—"}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{offer.name}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" noWrap title={offer.offer_items}>
                      {offer.offer_items ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={offer.discount_type_label ?? offer.discount_type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        bgcolor: statusColor(offer.status ?? ""),
                      }}
                    >
                      {offer.status ?? "—"}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {offer.image_url ? (
                      <Box
                        component="img"
                        src={resolveStorageUrl(offer.image_url) ?? offer.image_url}
                        alt={offer.name}
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid #eee",
                        }}
                      />
                    ) : (
                      <LocalOfferIcon sx={{ color: "text.disabled", fontSize: 32 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={Link}
                      to={`/offers/${offer.id}/edit`}
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ textTransform: "none" }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OffersList;
