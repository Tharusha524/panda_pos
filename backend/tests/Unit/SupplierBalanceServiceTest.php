<?php

namespace Tests\Unit;

use App\Models\Purchase;
use App\Services\PurchaseService;
use App\Services\SupplierBalanceService;
use PHPUnit\Framework\TestCase;

class SupplierBalanceServiceTest extends TestCase
{
    public function test_credit_purchase_increases_supplier_payable(): void
    {
        $service = new SupplierBalanceService();
        $purchase = new Purchase([
            'purchase_type' => PurchaseService::PURCHASE_TYPE_PURCHASE,
            'payment_method' => 'Credit',
            'amount' => 150.00,
            'supplier_id' => 5,
        ]);

        $this->assertSame(150.0, $service->balanceDeltaForPurchase($purchase));
    }

    public function test_credit_purchase_return_reduces_supplier_payable(): void
    {
        $service = new SupplierBalanceService();
        $purchase = new Purchase([
            'purchase_type' => PurchaseService::PURCHASE_TYPE_RETURN,
            'payment_method' => 'Credit',
            'amount' => 80.00,
            'supplier_id' => 5,
        ]);

        $this->assertSame(-80.0, $service->balanceDeltaForPurchase($purchase));
    }

    public function test_cash_purchase_does_not_affect_supplier_balance(): void
    {
        $service = new SupplierBalanceService();
        $purchase = new Purchase([
            'purchase_type' => PurchaseService::PURCHASE_TYPE_RETURN,
            'payment_method' => 'Cash',
            'amount' => 80.00,
            'supplier_id' => 5,
        ]);

        $this->assertSame(0.0, $service->balanceDeltaForPurchase($purchase));
    }
}
