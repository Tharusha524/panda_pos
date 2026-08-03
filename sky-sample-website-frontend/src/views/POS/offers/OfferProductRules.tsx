import React from "react";
import { Typography } from "@mui/material";
import type { DiscountRules } from "../../../api/offersApi";
import {
  InlineNumberField,
  OfferRuleRow,
  SelectProductButton,
} from "./OfferFormComponents";

type ProductRuleKey = keyof Pick<
  DiscountRules,
  | "buy_x_percent_off_all"
  | "set_percent_selected"
  | "bargain_bin"
  | "buy_x_fixed_off"
  | "buy_x_amount_off_each"
>;

interface OfferProductRulesProps {
  rules: DiscountRules;
  onUpdate: <K extends ProductRuleKey>(
    key: K,
    patch: Partial<DiscountRules[K]>
  ) => void;
  onSelectProduct: (key: ProductRuleKey) => void;
}

const OfferProductRules: React.FC<OfferProductRulesProps> = ({
  rules,
  onUpdate,
  onSelectProduct,
}) => (
  <>
    <OfferRuleRow
      label="Buy X or more units to receive Y% off on all units"
      checked={rules.buy_x_percent_off_all.enabled}
      onChange={(enabled) => onUpdate("buy_x_percent_off_all", { enabled })}
    >
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
        Buy{" "}
        <InlineNumberField
          value={rules.buy_x_percent_off_all.buy_quantity}
          onChange={(buy_quantity) => onUpdate("buy_x_percent_off_all", { buy_quantity })}
        />{" "}
        or more of{" "}
        <SelectProductButton
          productName={rules.buy_x_percent_off_all.product_name}
          onSelect={() => onSelectProduct("buy_x_percent_off_all")}
        />
      </Typography>
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4, mt: 1 }}>
        Get{" "}
        <InlineNumberField
          value={rules.buy_x_percent_off_all.percent_off}
          onChange={(percent_off) => onUpdate("buy_x_percent_off_all", { percent_off })}
        />{" "}
        % off
      </Typography>
    </OfferRuleRow>

    <OfferRuleRow
      label="Offer a set % discount on selected product/s"
      checked={rules.set_percent_selected.enabled}
      onChange={(enabled) => onUpdate("set_percent_selected", { enabled })}
    >
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
        Get{" "}
        <InlineNumberField
          value={rules.set_percent_selected.percent_off}
          onChange={(percent_off) => onUpdate("set_percent_selected", { percent_off })}
        />{" "}
        % off on{" "}
        <SelectProductButton
          productName={rules.set_percent_selected.product_name}
          onSelect={() => onSelectProduct("set_percent_selected")}
        />
      </Typography>
    </OfferRuleRow>

    <OfferRuleRow
      label="Create a 'bargain bin' to sell an unsorted selection of items at one set price"
      checked={rules.bargain_bin.enabled}
      onChange={(enabled) => onUpdate("bargain_bin", { enabled })}
    >
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
        Set price Rs{" "}
        <InlineNumberField
          value={rules.bargain_bin.price}
          onChange={(price) => onUpdate("bargain_bin", { price })}
          width={80}
        />
      </Typography>
    </OfferRuleRow>

    <OfferRuleRow
      label="Buy X units of product A and get $Y off (Set $ amount off, not %)"
      checked={rules.buy_x_fixed_off.enabled}
      onChange={(enabled) => onUpdate("buy_x_fixed_off", { enabled })}
    >
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
        Buy{" "}
        <InlineNumberField
          value={rules.buy_x_fixed_off.buy_quantity}
          onChange={(buy_quantity) => onUpdate("buy_x_fixed_off", { buy_quantity })}
        />{" "}
        of{" "}
        <SelectProductButton
          productName={rules.buy_x_fixed_off.product_name}
          onSelect={() => onSelectProduct("buy_x_fixed_off")}
        />{" "}
        get Rs{" "}
        <InlineNumberField
          value={rules.buy_x_fixed_off.amount_off}
          onChange={(amount_off) => onUpdate("buy_x_fixed_off", { amount_off })}
          width={80}
        />{" "}
        off
      </Typography>
    </OfferRuleRow>

    <OfferRuleRow
      label="Buy X or more units of product A, get $Y off each unit"
      checked={rules.buy_x_amount_off_each.enabled}
      onChange={(enabled) => onUpdate("buy_x_amount_off_each", { enabled })}
    >
      <Typography variant="body2" component="div" sx={{ lineHeight: 2.4 }}>
        Buy{" "}
        <InlineNumberField
          value={rules.buy_x_amount_off_each.buy_quantity}
          onChange={(buy_quantity) => onUpdate("buy_x_amount_off_each", { buy_quantity })}
        />{" "}
        or more of{" "}
        <SelectProductButton
          productName={rules.buy_x_amount_off_each.product_name}
          onSelect={() => onSelectProduct("buy_x_amount_off_each")}
        />{" "}
        get Rs{" "}
        <InlineNumberField
          value={rules.buy_x_amount_off_each.amount_off_each}
          onChange={(amount_off_each) =>
            onUpdate("buy_x_amount_off_each", { amount_off_each })
          }
          width={80}
        />{" "}
        off each
      </Typography>
    </OfferRuleRow>
  </>
);

export default OfferProductRules;
