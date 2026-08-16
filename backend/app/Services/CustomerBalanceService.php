<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Sale;

class CustomerBalanceService
{
    public static function isCreditPayment(?string $method): bool
    {
        return strtolower(trim((string) $method)) === 'credit';
    }

    public function balanceDeltaForSale(Sale $sale): float
    {
        if (!$this->saleAffectsBalance($sale)) {
            return 0.0;
        }

        if (OrderTransactionService::isExchange($sale->transaction_type)) {
            if (self::isCreditPayment($sale->payment_method)) {
                // Whole exchange settled via the account — signed net_amount already
                // reflects both the new-sale debit and the return credit together.
                $exchangeAmount = round((float) $sale->net_amount, 2);

                return abs($exchangeAmount) < 0.005 ? 0.0 : $exchangeAmount;
            }

            // Settled in cash/card for the net difference right now — only the
            // returned portion still needs to clear from the account, and only if
            // those items came from a credit-sold bill in the first place (nothing
            // was actually paid for them, so there's nothing to refund as cash;
            // the debt just needs to be written off).
            if (!$this->exchangeSourceWasCredit($sale)) {
                return 0.0;
            }
            $returnSubTotal = round((float) ($sale->return_sub_total ?? 0), 2);

            return $returnSubTotal > 0 ? -$returnSubTotal : 0.0;
        }

        $amount = round((float) $sale->net_amount, 2);
        if ($amount <= 0) {
            return 0.0;
        }

        if (OrderTransactionService::isSalesReturn($sale->transaction_type)) {
            return -$amount;
        }

        return $amount;
    }

    public function applySaleEffect(Sale $sale): void
    {
        $delta = $this->balanceDeltaForSale($sale);
        if (abs($delta) < 0.005 || !$sale->customer_id) {
            return;
        }

        $this->adjustCustomerBalance((int) $sale->customer_id, $delta);
    }

    public function revertSaleEffect(Sale $sale): void
    {
        $delta = $this->balanceDeltaForSale($sale);
        if (abs($delta) < 0.005 || !$sale->customer_id) {
            return;
        }

        $this->adjustCustomerBalance((int) $sale->customer_id, -$delta);
    }

    public function syncSaleChange(Sale $after, ?Sale $before = null): void
    {
        if ($before) {
            $this->revertSaleEffect($before);
        }

        $this->applySaleEffect($after);
    }

    private function saleAffectsBalance(Sale $sale): bool
    {
        $status = strtolower(trim((string) ($sale->order_status ?? OrderTransactionService::ORDER_STATUS_COMPLETED)));
        if ($status !== OrderTransactionService::ORDER_STATUS_COMPLETED || !$sale->customer_id) {
            return false;
        }

        if (self::isCreditPayment($sale->payment_method)) {
            return true;
        }

        // An exchange paid in cash/card can still owe a balance write-off when the
        // returned items came from a credit-sold bill — see balanceDeltaForSale().
        return OrderTransactionService::isExchange($sale->transaction_type)
            && $this->exchangeSourceWasCredit($sale);
    }

    /**
     * True when this exchange's return items were originally sold on credit
     * (i.e. the customer never actually paid for them), regardless of how the
     * exchange itself is being settled now.
     */
    private function exchangeSourceWasCredit(Sale $sale): bool
    {
        if (!$sale->returned_from_sale_id) {
            return false;
        }

        $source = Sale::find($sale->returned_from_sale_id);

        return $source !== null && self::isCreditPayment($source->payment_method);
    }

    private function adjustCustomerBalance(int $customerId, float $delta): void
    {
        $customer = Customer::lockForUpdate()->find($customerId);
        if (!$customer) {
            return;
        }

        $customer->net_balance = round((float) $customer->net_balance + $delta, 2);
        $customer->save();
    }
}
