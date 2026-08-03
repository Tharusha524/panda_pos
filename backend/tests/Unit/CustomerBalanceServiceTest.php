<?php

namespace Tests\Unit;

use App\Models\Sale;
use App\Services\CustomerBalanceService;
use App\Services\OrderTransactionService;
use PHPUnit\Framework\TestCase;

class CustomerBalanceServiceTest extends TestCase
{
    public function test_is_credit_payment_is_case_insensitive(): void
    {
        $this->assertTrue(CustomerBalanceService::isCreditPayment('Credit'));
        $this->assertTrue(CustomerBalanceService::isCreditPayment(' credit '));
        $this->assertFalse(CustomerBalanceService::isCreditPayment('Cash'));
        $this->assertFalse(CustomerBalanceService::isCreditPayment('Card'));
    }

    public function test_balance_delta_zero_for_non_credit_sale(): void
    {
        $service = new CustomerBalanceService();
        $sale = new Sale([
            'payment_method' => 'Cash',
            'order_status' => OrderTransactionService::ORDER_STATUS_COMPLETED,
            'customer_id' => 1,
            'net_amount' => 500,
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_SALE,
        ]);

        $this->assertSame(0.0, $service->balanceDeltaForSale($sale));
    }

    public function test_balance_delta_positive_for_credit_sale(): void
    {
        $service = new CustomerBalanceService();
        $sale = new Sale([
            'payment_method' => 'Credit',
            'order_status' => OrderTransactionService::ORDER_STATUS_COMPLETED,
            'customer_id' => 1,
            'net_amount' => 1250.55,
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_SALE,
        ]);

        $this->assertSame(1250.55, $service->balanceDeltaForSale($sale));
    }

    public function test_balance_delta_negative_for_credit_return(): void
    {
        $service = new CustomerBalanceService();
        $sale = new Sale([
            'payment_method' => 'Credit',
            'order_status' => OrderTransactionService::ORDER_STATUS_COMPLETED,
            'customer_id' => 1,
            'net_amount' => 300,
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_RETURN,
        ]);

        $this->assertSame(-300.0, $service->balanceDeltaForSale($sale));
    }

    public function test_balance_delta_zero_for_hold_orders(): void
    {
        $service = new CustomerBalanceService();
        $sale = new Sale([
            'payment_method' => 'Credit',
            'order_status' => OrderTransactionService::ORDER_STATUS_HOLD,
            'customer_id' => 1,
            'net_amount' => 100,
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_SALE,
        ]);

        $this->assertSame(0.0, $service->balanceDeltaForSale($sale));
    }
}
