<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\Supplier;

class SupplierBalanceService
{
    public static function isCreditPayment(?string $method): bool
    {
        return strtolower(trim((string) $method)) === 'credit';
    }

    public function balanceDeltaForPurchase(Purchase $purchase): float
    {
        if (!$this->purchaseAffectsBalance($purchase)) {
            return 0.0;
        }

        $amount = round((float) $purchase->amount, 2);
        if ($amount <= 0) {
            return 0.0;
        }

        if (PurchaseService::isPurchaseReturn($purchase->purchase_type)) {
            return -$amount;
        }

        return $amount;
    }

    public function applyPurchaseEffect(Purchase $purchase): void
    {
        $delta = $this->balanceDeltaForPurchase($purchase);
        if (abs($delta) < 0.005 || !$purchase->supplier_id) {
            return;
        }

        $this->adjustSupplierBalance((int) $purchase->supplier_id, $delta);
    }

    public function revertPurchaseEffect(Purchase $purchase): void
    {
        $delta = $this->balanceDeltaForPurchase($purchase);
        if (abs($delta) < 0.005 || !$purchase->supplier_id) {
            return;
        }

        $this->adjustSupplierBalance((int) $purchase->supplier_id, -$delta);
    }

    public function syncPurchaseChange(Purchase $after, ?Purchase $before = null): void
    {
        if ($before) {
            $this->revertPurchaseEffect($before);
        }

        $this->applyPurchaseEffect($after);
    }

    private function purchaseAffectsBalance(Purchase $purchase): bool
    {
        return $purchase->supplier_id
            && self::isCreditPayment($purchase->payment_method);
    }

    private function adjustSupplierBalance(int $supplierId, float $delta): void
    {
        $supplier = Supplier::lockForUpdate()->find($supplierId);
        if (!$supplier) {
            return;
        }

        $supplier->net_balance = round((float) $supplier->net_balance + $delta, 2);
        $supplier->save();
    }
}
