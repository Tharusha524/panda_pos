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

        return $status === OrderTransactionService::ORDER_STATUS_COMPLETED
            && $sale->customer_id
            && self::isCreditPayment($sale->payment_method);
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
