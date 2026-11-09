<?php

namespace Tests\Unit;

use App\Models\Role;
use App\Models\User;
use App\Services\OrderTransactionService;
use App\Services\PermissionService;
use PHPUnit\Framework\TestCase;

class MobilePermissionTest extends TestCase
{
    private PermissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PermissionService();
    }

    /**
     * @param  list<string>  $permissions
     */
    private function userWithRole(array $permissions, string $slug = 'staff'): User
    {
        // loadMissing() builds a query even for a loaded relation; there's no DB here.
        $user = new class(['role' => $slug]) extends User {
            public function loadMissing($relations)
            {
                return $this;
            }
        };
        $role = new Role(['name' => 'Test', 'slug' => $slug, 'permissions' => $permissions]);
        $user->setRelation('roleModel', $role);

        return $user;
    }

    public function test_role_without_mobile_section_keeps_full_access(): void
    {
        $access = $this->service->resolveMobileAccess(['sales.view'], false);

        $this->assertNotEmpty($access);
        $this->assertNotContains(false, $access);
    }

    public function test_admin_always_has_full_access(): void
    {
        $access = $this->service->resolveMobileAccess([PermissionService::MOBILE_CONFIGURED], true);

        $this->assertNotContains(false, $access);
    }

    public function test_configured_role_with_nothing_ticked_is_fully_locked(): void
    {
        $access = $this->service->resolveMobileAccess([PermissionService::MOBILE_CONFIGURED], false);

        $this->assertNotContains(true, $access);
    }

    public function test_unticked_tab_locks_every_feature_under_it(): void
    {
        $access = $this->service->resolveMobileAccess([
            PermissionService::MOBILE_CONFIGURED,
            'mobile.products.add',
            'mobile.products.tog',
            'mobile.sales',
            'mobile.sales.credit',
        ], false);

        $this->assertFalse($access['mobile.products']);
        $this->assertFalse($access['mobile.products.add']);
        $this->assertFalse($access['mobile.products.tog']);
        $this->assertTrue($access['mobile.sales']);
        $this->assertTrue($access['mobile.sales.credit']);
        $this->assertFalse($access['mobile.sales.return']);
    }

    public function test_feature_needs_its_required_feature(): void
    {
        $access = $this->service->resolveMobileAccess([
            PermissionService::MOBILE_CONFIGURED,
            'mobile.home',
            'mobile.customers.delete',
            'mobile.customers.edit',
        ], false);

        // customers.view is off, so edit and delete under it are off too.
        $this->assertFalse($access['mobile.customers.edit']);
        $this->assertFalse($access['mobile.customers.delete']);
    }

    public function test_every_catalog_key_is_resolved_and_unique(): void
    {
        $keys = $this->service->mobilePermissionKeys();
        $access = $this->service->resolveMobileAccess([], false);

        $this->assertSame(count($keys), count(array_unique($keys)));
        $this->assertSame($keys, array_keys($access));
    }

    public function test_requires_always_points_to_an_earlier_key_in_the_same_tab(): void
    {
        foreach ($this->service->mobilePermissionCatalog() as $tab) {
            $seen = [];
            foreach ($tab['groups'] as $group) {
                foreach ($group['items'] as $item) {
                    if (!empty($item['requires'])) {
                        $this->assertContains($item['requires'], $seen, $item['key']);
                    }
                    $seen[] = $item['key'];
                }
            }
        }
    }

    public function test_sale_rules(): void
    {
        $cashOnly = $this->userWithRole([PermissionService::MOBILE_CONFIGURED, 'mobile.sales']);
        $plain = ['transaction_type' => OrderTransactionService::TRANSACTION_TYPE_SALE, 'payment_method' => 'Cash'];

        $this->assertNull($this->service->mobileSaleDenial($cashOnly, $plain));
        $this->assertSame('mobile.sales.credit', $this->service->mobileSaleDenial($cashOnly, ['payment_method' => 'Credit'] + $plain));
        $this->assertSame('mobile.sales.bank', $this->service->mobileSaleDenial($cashOnly, ['payment_method' => 'Bank Transfer'] + $plain));
        $this->assertSame('mobile.sales.split', $this->service->mobileSaleDenial($cashOnly, [
            'payment_method' => 'Split',
            'payment_splits' => [['payment_method' => 'Cash', 'amount' => 1]],
        ] + $plain));
        $this->assertSame('mobile.sales.hold', $this->service->mobileSaleDenial($cashOnly, ['order_status' => 'hold'] + $plain));
        $this->assertSame('mobile.sales.return', $this->service->mobileSaleDenial($cashOnly, [
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_RETURN,
            'returned_from_sale_id' => 5,
        ]));

        $returner = $this->userWithRole([PermissionService::MOBILE_CONFIGURED, 'mobile.sales', 'mobile.sales.return']);
        // Refunding a credit sale back to Credit is a return, not giving credit.
        $this->assertNull($this->service->mobileSaleDenial($returner, [
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_RETURN,
            'returned_from_sale_id' => 5,
            'payment_method' => 'Credit',
        ]));
        $this->assertSame('mobile.sales.return_without_bill', $this->service->mobileSaleDenial($returner, [
            'transaction_type' => OrderTransactionService::TRANSACTION_TYPE_RETURN,
        ]));

        $locked = $this->userWithRole([PermissionService::MOBILE_CONFIGURED]);
        $this->assertSame('mobile.sales', $this->service->mobileSaleDenial($locked, $plain));

        $legacy = $this->userWithRole(['sales.view']);
        $this->assertNull($this->service->mobileSaleDenial($legacy, ['payment_method' => 'Credit'] + $plain));
    }

    public function test_report_rules(): void
    {
        $dayEndOnly = $this->userWithRole([PermissionService::MOBILE_CONFIGURED, 'mobile.reports', 'mobile.reports.day_end']);

        $this->assertTrue($this->service->mobileCanViewReport($dayEndOnly, 'sales-summary'));
        $this->assertFalse($this->service->mobileCanViewReport($dayEndOnly, 'cash-in-hand'));
        $this->assertTrue($this->service->mobileCanViewReport($dayEndOnly, 'some-website-only-report'));

        $noReports = $this->userWithRole([PermissionService::MOBILE_CONFIGURED, 'mobile.sales']);
        $this->assertFalse($this->service->mobileCanViewReport($noReports, 'some-website-only-report'));
    }
}
