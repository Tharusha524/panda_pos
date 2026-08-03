import React from "react";
import { TextField, Typography } from "@mui/material";
import type { DiscountRules } from "../../../api/offersApi";
import { InlineNumberField, OfferRuleRow } from "./OfferFormComponents";

interface OfferOrderRulesProps {
  rules: DiscountRules;
  onUpdate: (
    key: "order_min_total_percent" | "order_promo_code_percent",
    patch: Record<string, unknown>
  ) => void;
}

const OfferOrderRules: React.FC<OfferOrderRulesProps> = ({ rules, onUpdate }) => {
  const minTotal = rules.order_min_total_percent ?? {
    enabled: true,
    min_order_amount: 0,
    percent_off: 0,
  };
  const promoCode = rules.order_promo_code_percent ?? {
    enabled: false,
    percent_off: 0,
    promo_code: "",
  };

  return (
    <>
      <OfferRuleRow
        label="Apply X% discount if total order value is more than Y amount"
        checked={minTotal.enabled}
        onChange={(enabled) => onUpdate("order_min_total_percent", { enabled })}
      >
        <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
          Total order value is more than or equal to Rs{" "}
          <InlineNumberField
            value={minTotal.min_order_amount}
            onChange={(min_order_amount) =>
              onUpdate("order_min_total_percent", { min_order_amount })
            }
            width={80}
          />
        </Typography>
        <Typography variant="body2" component="div" sx={{ lineHeight: 2.4, mt: 1 }}>
          apply discount{" "}
          <InlineNumberField
            value={minTotal.percent_off}
            onChange={(percent_off) =>
              onUpdate("order_min_total_percent", { percent_off })
            }
          />{" "}
          % off
        </Typography>
      </OfferRuleRow>

      <OfferRuleRow
        label="Apply X% discount to the order total when the promo code is used"
        checked={promoCode.enabled}
        onChange={(enabled) => onUpdate("order_promo_code_percent", { enabled })}
      >
        <Typography variant="body2" component="div" sx={{ lineHeight: 2.4, mb: 1 }}>
          apply discount{" "}
          <InlineNumberField
            value={promoCode.percent_off}
            onChange={(percent_off) =>
              onUpdate("order_promo_code_percent", { percent_off })
            }
          />{" "}
          % off when promo code is used
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Promo code"
          value={promoCode.promo_code}
          onChange={(e) =>
            onUpdate("order_promo_code_percent", { promo_code: e.target.value })
          }
          sx={{ maxWidth: 280 }}
        />
      </OfferRuleRow>
    </>
  );
};

export default OfferOrderRules;
