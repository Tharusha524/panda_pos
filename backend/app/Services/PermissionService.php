<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;
use App\Support\UserSchema;

class PermissionService
{
    /** All POS menu / feature keys used by the frontend sidebar */
    public const POS_KEYS = [
        'pos.dashboard',
        'pos.sales',
        'pos.payments',
        'pos.expenses',
        'pos.customers',
        'pos.items',
        'pos.inventory',
        'pos.purchasing',
        'pos.suppliers',
        'pos.shipping',
        'pos.offers',
        'pos.repair',
        'pos.reports',
        'pos.settings',
        'users.manage',
    ];

    /** Map role permission strings → POS access keys */
    private const PERMISSION_TO_POS = [
        'sales.view' => ['pos.dashboard', 'pos.sales'],
        'sales.create' => ['pos.sales'],
        'inventory.view' => ['pos.items', 'pos.inventory'],
        'inventory.edit' => ['pos.items', 'pos.inventory'],
        'customers.view' => ['pos.customers'],
        'payments.create' => ['pos.payments', 'pos.expenses'],
        'purchasing.view' => ['pos.purchasing', 'pos.suppliers'],
        'shipping.view' => ['pos.shipping'],
        'offers.view' => ['pos.offers'],
        'repair.view' => ['pos.repair'],
        'reports.view' => ['pos.reports'],
        'settings.view' => ['pos.settings'],
        'users.view' => ['users.manage', 'pos.settings'],
    ];

    /**
     * Stored in a role's permission list once its Mobile App section has been
     * saved. A role without it predates mobile permissions and keeps full
     * mobile access, so nobody loses access when this feature ships.
     */
    public const MOBILE_CONFIGURED = 'mobile.configured';

    /**
     * Mobile app permission catalog, grouped by the app's 5 bottom tabs. The
     * single source of truth — the website role editor renders it and the
     * mobile app checks these exact keys. `requires` must point to a key that
     * appears earlier in the same tab.
     */
    private const MOBILE_CATALOG = [
        [
            'key' => 'mobile.home',
            'label' => 'Home',
            'groups' => [
                ['label' => 'Dashboard', 'items' => [
                    ['key' => 'mobile.home.figures', 'label' => 'See business figures (sales today, month sales, receivables)'],
                    ['key' => 'mobile.home.today_activity', 'label' => 'Today activity'],
                    ['key' => 'mobile.home.print_daily', 'label' => 'Print daily summary', 'requires' => 'mobile.home.today_activity'],
                    ['key' => 'mobile.home.alerts', 'label' => 'Alerts'],
                ]],
                ['label' => 'Customers', 'items' => [
                    ['key' => 'mobile.customers.view', 'label' => 'Open customers list'],
                    ['key' => 'mobile.customers.create', 'label' => 'Add customer', 'requires' => 'mobile.customers.view'],
                    ['key' => 'mobile.customers.edit', 'label' => 'Edit customer', 'requires' => 'mobile.customers.view'],
                    ['key' => 'mobile.customers.delete', 'label' => 'Delete customer', 'requires' => 'mobile.customers.edit'],
                    ['key' => 'mobile.customers.location', 'label' => 'Capture customer GPS location & directions', 'requires' => 'mobile.customers.view'],
                    ['key' => 'mobile.customers.receive_payment', 'label' => 'Receive payment', 'requires' => 'mobile.customers.view'],
                    ['key' => 'mobile.customers.statement', 'label' => 'Print customer statement', 'requires' => 'mobile.customers.receive_payment'],
                    ['key' => 'mobile.customers.history', 'label' => 'Customer history & receipts', 'requires' => 'mobile.customers.view'],
                    ['key' => 'mobile.customers.cheque_return', 'label' => 'Mark cheque as returned', 'requires' => 'mobile.customers.history'],
                ]],
                ['label' => 'Expenses', 'items' => [
                    ['key' => 'mobile.expenses.view', 'label' => 'Open expenses list'],
                    ['key' => 'mobile.expenses.create', 'label' => 'Add expense', 'requires' => 'mobile.expenses.view'],
                    ['key' => 'mobile.expenses.edit', 'label' => 'Edit expense', 'requires' => 'mobile.expenses.view'],
                    ['key' => 'mobile.expenses.delete', 'label' => 'Delete expense', 'requires' => 'mobile.expenses.edit'],
                ]],
            ],
        ],
        [
            'key' => 'mobile.sales',
            'label' => 'Sales',
            'groups' => [
                ['label' => 'Selling', 'items' => [
                    ['key' => 'mobile.sales.create_customer', 'label' => 'Create new customer during sale'],
                    ['key' => 'mobile.sales.discount', 'label' => 'Give discount / change price'],
                ]],
                ['label' => 'Payment methods', 'items' => [
                    ['key' => 'mobile.sales.credit', 'label' => 'Credit sale'],
                    ['key' => 'mobile.sales.cheque', 'label' => 'Cheque payment'],
                    ['key' => 'mobile.sales.bank', 'label' => 'Bank transfer payment'],
                    ['key' => 'mobile.sales.split', 'label' => 'Split payment'],
                ]],
                ['label' => 'Returns', 'items' => [
                    ['key' => 'mobile.sales.return', 'label' => 'Return sale'],
                    ['key' => 'mobile.sales.return_without_bill', 'label' => 'Return without original bill', 'requires' => 'mobile.sales.return'],
                    ['key' => 'mobile.sales.exchange', 'label' => 'Exchange (return & sell in one bill)', 'requires' => 'mobile.sales.return'],
                ]],
                ['label' => 'Hold orders', 'items' => [
                    ['key' => 'mobile.sales.hold', 'label' => 'Hold orders (save & resume)'],
                    ['key' => 'mobile.sales.hold_delete', 'label' => 'Delete hold orders', 'requires' => 'mobile.sales.hold'],
                ]],
                ['label' => 'Receipts', 'items' => [
                    ['key' => 'mobile.sales.edit', 'label' => 'Edit sale before confirming'],
                    ['key' => 'mobile.sales.share_receipt', 'label' => 'Share / download receipt image'],
                ]],
            ],
        ],
        [
            'key' => 'mobile.products',
            'label' => 'Products',
            'groups' => [
                ['label' => 'Items', 'items' => [
                    ['key' => 'mobile.products.add', 'label' => 'Add item'],
                    ['key' => 'mobile.products.edit', 'label' => 'Edit item (incl. photo)'],
                    ['key' => 'mobile.products.history', 'label' => 'Item history'],
                    ['key' => 'mobile.products.batches', 'label' => 'Add / edit item batches'],
                    ['key' => 'mobile.products.batch_delete', 'label' => 'Delete item batch', 'requires' => 'mobile.products.batches'],
                    ['key' => 'mobile.products.stock_adjust', 'label' => 'Stock adjustment'],
                ]],
                ['label' => 'Stock & locations', 'items' => [
                    ['key' => 'mobile.products.tog', 'label' => 'TOG / stock transfer'],
                    ['key' => 'mobile.products.add_location', 'label' => 'Add location (lorry)'],
                ]],
                ['label' => 'Purchases', 'items' => [
                    ['key' => 'mobile.purchases.view', 'label' => 'Open purchases list'],
                    ['key' => 'mobile.purchases.create', 'label' => 'Create purchase', 'requires' => 'mobile.purchases.view'],
                    ['key' => 'mobile.purchases.print', 'label' => 'Print purchase receipt', 'requires' => 'mobile.purchases.view'],
                ]],
            ],
        ],
        [
            'key' => 'mobile.reports',
            'label' => 'Reports',
            'groups' => [
                ['label' => 'Overview', 'items' => [
                    ['key' => 'mobile.reports.daily_summary', 'label' => 'Daily summary'],
                ]],
                ['label' => 'Sales & customers', 'items' => [
                    ['key' => 'mobile.reports.sales_report', 'label' => 'Sales report'],
                    ['key' => 'mobile.reports.expense_report', 'label' => 'Expense report'],
                    ['key' => 'mobile.reports.customer_report', 'label' => 'Customer report'],
                    ['key' => 'mobile.reports.customer_settlement', 'label' => 'Customer settlement'],
                    ['key' => 'mobile.reports.return_report', 'label' => 'Return report'],
                    ['key' => 'mobile.reports.credit_sales', 'label' => 'Credit sales'],
                ]],
                ['label' => 'Inventory', 'items' => [
                    ['key' => 'mobile.reports.item_report', 'label' => 'Item report'],
                    ['key' => 'mobile.reports.reorder', 'label' => 'Reorder'],
                    ['key' => 'mobile.reports.expiry_report', 'label' => 'Expiry report'],
                    ['key' => 'mobile.reports.day_end', 'label' => 'Day End report'],
                ]],
                ['label' => 'Finance', 'items' => [
                    ['key' => 'mobile.reports.cash_in_hand', 'label' => 'Cash in hand'],
                    ['key' => 'mobile.reports.payment_report', 'label' => 'Payment report'],
                    ['key' => 'mobile.reports.customer_aging', 'label' => 'Customer aging'],
                    ['key' => 'mobile.reports.finance_profit_loss', 'label' => 'Profit & loss'],
                    ['key' => 'mobile.reports.finance_transactions_summary', 'label' => 'Transactions summary'],
                ]],
                ['label' => 'Report actions', 'items' => [
                    ['key' => 'mobile.reports.print', 'label' => 'Print reports'],
                    ['key' => 'mobile.reports.export', 'label' => 'Excel export'],
                ]],
            ],
        ],
        [
            'key' => 'mobile.settings',
            'label' => 'Settings',
            'note' => 'The Settings tab always opens so users can view their profile and sign out — this controls the settings rows only.',
            'groups' => [
                ['label' => 'Settings', 'items' => [
                    ['key' => 'mobile.settings.company', 'label' => 'Company settings'],
                    ['key' => 'mobile.settings.inventory', 'label' => 'Inventory settings'],
                    ['key' => 'mobile.settings.orders', 'label' => 'Order settings'],
                    ['key' => 'mobile.settings.printer', 'label' => 'Receipt printer setup'],
                    ['key' => 'mobile.settings.receipt_layout', 'label' => 'Receipt layout'],
                    ['key' => 'mobile.settings.notifications', 'label' => 'Notifications'],
                    ['key' => 'mobile.settings.alerts', 'label' => 'Alert settings'],
                    ['key' => 'mobile.settings.employees', 'label' => 'Employees'],
                    ['key' => 'mobile.settings.server', 'label' => 'Server / API setting'],
                ]],
            ],
        ],
    ];

    /** Backend report keys the mobile app requests → mobile report permissions (any one is enough). */
    private const MOBILE_REPORT_KEYS = [
        'sales-details' => ['mobile.reports.sales_report'],
        'expense-summary' => ['mobile.reports.expense_report'],
        'customer-list' => ['mobile.reports.customer_report'],
        'customer-settlement' => ['mobile.reports.customer_settlement'],
        'sales-return-details' => ['mobile.reports.return_report'],
        'customer-outstanding' => ['mobile.reports.credit_sales'],
        'item-list' => ['mobile.reports.item_report'],
        'reorder-items' => ['mobile.reports.reorder'],
        'expiry-items' => ['mobile.reports.expiry_report'],
        'cash-in-hand' => ['mobile.reports.cash_in_hand'],
        'customer-payment' => ['mobile.reports.payment_report'],
        'customer-aging' => ['mobile.reports.customer_aging'],
        'income-expenses' => ['mobile.reports.finance_profit_loss'],
        'transaction-summary' => ['mobile.reports.finance_transactions_summary'],
        // Shared by the Day End report and the Sales/Return Excel exports.
        'sales-summary' => ['mobile.reports.day_end', 'mobile.reports.sales_report', 'mobile.reports.return_report'],
    ];

    public const MOBILE_CLIENT_HEADER = 'X-Client-App';

    public const MOBILE_CLIENT_VALUE = 'pos-mobile';

    public const MOBILE_DENIED_MESSAGE = "You don't have access to this feature. Contact your admin.";

    /**
     * @return list<array<string, mixed>>
     */
    public function mobilePermissionCatalog(): array
    {
        return self::MOBILE_CATALOG;
    }

    /**
     * Every assignable mobile key: the 5 tab keys plus every feature key.
     *
     * @return list<string>
     */
    public function mobilePermissionKeys(): array
    {
        $keys = [];
        foreach (self::MOBILE_CATALOG as $tab) {
            $keys[] = $tab['key'];
            foreach ($tab['groups'] as $group) {
                foreach ($group['items'] as $item) {
                    $keys[] = $item['key'];
                }
            }
        }

        return $keys;
    }

    /**
     * Effective mobile access. A feature is only on when its own key, its
     * tab's key, and (if set) its `requires` key are all on — so unticking a
     * tab on the website locks everything under it.
     *
     * @param  list<string>  $list
     * @return array<string, bool>
     */
    public function resolveMobileAccess(array $list, bool $isAdmin): array
    {
        $fullAccess = $isAdmin || !in_array(self::MOBILE_CONFIGURED, $list, true);
        $granted = array_flip($list);
        $access = [];

        foreach (self::MOBILE_CATALOG as $tab) {
            $tabOn = $fullAccess || isset($granted[$tab['key']]);
            $access[$tab['key']] = $tabOn;

            foreach ($tab['groups'] as $group) {
                foreach ($group['items'] as $item) {
                    $on = $tabOn && ($fullAccess || isset($granted[$item['key']]));
                    if ($on && !empty($item['requires'])) {
                        $on = $access[$item['requires']] ?? false;
                    }
                    $access[$item['key']] = $on;
                }
            }
        }

        return $access;
    }

    public function isMobileRequest(\Illuminate\Http\Request $request): bool
    {
        return $request->header(self::MOBILE_CLIENT_HEADER) === self::MOBILE_CLIENT_VALUE;
    }

    /**
     * @param  list<string>  $keys  any one of them grants access
     */
    public function mobileCan(User $user, array $keys): bool
    {
        $access = $this->resolveForUser($user)['mobile_access'];
        foreach ($keys as $key) {
            if (!empty($access[$key])) {
                return true;
            }
        }

        return false;
    }

    public function mobileCanViewReport(User $user, string $reportKey): bool
    {
        $keys = self::MOBILE_REPORT_KEYS[strtolower(trim($reportKey))] ?? null;
        if ($keys === null) {
            // Not a report the mobile app shows — only the Reports tab gates it.
            $keys = ['mobile.reports'];
        }

        return $this->mobileCan($user, $keys);
    }

    /**
     * Mobile key a sale payload needs beyond plain cash selling, or null when
     * it is allowed. Discounts are not checked here: an offer also sets a
     * discount, so the server can't tell a manual one apart — the app gates it.
     *
     * @param  array<string, mixed>  $payload
     */
    public function mobileSaleDenial(User $user, array $payload): ?string
    {
        $needed = [];
        $type = trim((string) ($payload['transaction_type'] ?? ''));

        if ($type === OrderTransactionService::TRANSACTION_TYPE_RETURN) {
            $needed[] = empty($payload['returned_from_sale_id'])
                ? 'mobile.sales.return_without_bill'
                : 'mobile.sales.return';
        } elseif ($type === OrderTransactionService::TRANSACTION_TYPE_EXCHANGE) {
            $needed[] = 'mobile.sales.exchange';
        }

        if (strtolower(trim((string) ($payload['order_status'] ?? ''))) === OrderTransactionService::ORDER_STATUS_HOLD) {
            $needed[] = 'mobile.sales.hold';
        }

        // Payment methods only matter on a normal sale — a return/exchange
        // refund (e.g. back to Credit on a credit sale) isn't giving credit.
        $isPlainSale = $type === '' || $type === OrderTransactionService::TRANSACTION_TYPE_SALE;
        $methods = $isPlainSale ? [(string) ($payload['payment_method'] ?? '')] : [];
        $splits = $isPlainSale && is_array($payload['payment_splits'] ?? null) ? $payload['payment_splits'] : [];
        if ($splits !== []) {
            $needed[] = 'mobile.sales.split';
            foreach ($splits as $split) {
                $methods[] = (string) (is_array($split) ? ($split['payment_method'] ?? '') : '');
            }
        }
        foreach ($methods as $method) {
            $m = strtolower(trim($method));
            if ($m === 'split') {
                $needed[] = 'mobile.sales.split';
            } elseif (str_contains($m, 'credit')) {
                $needed[] = 'mobile.sales.credit';
            } elseif (str_contains($m, 'cheque') || str_contains($m, 'check')) {
                $needed[] = 'mobile.sales.cheque';
            } elseif (str_contains($m, 'bank')) {
                $needed[] = 'mobile.sales.bank';
            }
        }

        $needed[] = 'mobile.sales';
        foreach (array_unique($needed) as $key) {
            if (!$this->mobileCan($user, [$key])) {
                return $key;
            }
        }

        return null;
    }

    public function isAdmin(User $user): bool
    {
        $slug = strtolower((string) ($user->roleModel?->slug ?? $user->role ?? ''));

        return $slug === 'admin' || in_array('*', $this->rolePermissionList($user), true);
    }

    public function canManageUsers(User $user): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $perms = $this->rolePermissionList($user);

        return in_array('users.view', $perms, true) || in_array('users.manage', $perms, true);
    }

    /**
     * @return list<string>
     */
    public function rolePermissionList(User $user): array
    {
        $user->loadMissing('roleModel');
        $raw = $user->roleModel?->permissions ?? [];

        if (!is_array($raw)) {
            return [];
        }

        return array_values(array_filter(array_map('strval', $raw)));
    }

    /**
     * @return array{list: list<string>, pos_access: array<string, bool>, mobile_access: array<string, bool>, can_manage_users: bool, is_admin: bool}
     */
    public function resolveForUser(User $user): array
    {
        $list = $this->rolePermissionList($user);
        $isAdmin = $this->isAdmin($user);
        $posAccess = [];

        foreach (self::POS_KEYS as $key) {
            $posAccess[$key] = false;
        }

        if ($isAdmin) {
            foreach (self::POS_KEYS as $key) {
                $posAccess[$key] = true;
            }

            return [
                'list' => array_merge(['*'], $list),
                'pos_access' => $posAccess,
                'mobile_access' => $this->resolveMobileAccess($list, true),
                'can_manage_users' => true,
                'is_admin' => true,
            ];
        }

        foreach ($list as $perm) {
            foreach (self::PERMISSION_TO_POS[$perm] ?? [] as $posKey) {
                $posAccess[$posKey] = true;
            }
        }

        if (in_array('users.view', $list, true)) {
            $posAccess['users.manage'] = true;
            $posAccess['pos.settings'] = true;
        }

        if (
            $posAccess['pos.sales']
            || $posAccess['pos.payments']
            || $posAccess['pos.items']
            || $posAccess['pos.inventory']
        ) {
            $posAccess['pos.dashboard'] = true;
        }

        return [
            'list' => $list,
            'pos_access' => $posAccess,
            'mobile_access' => $this->resolveMobileAccess($list, false),
            'can_manage_users' => $this->canManageUsers($user),
            'is_admin' => false,
        ];
    }

    public function formatUserForApi(User $user): array
    {
        $user->loadMissing('roleModel');
        $resolved = $this->resolveForUser($user);

        $company = null;
        $userCompanyId = UserSchema::companyIdFor($user);
        if ($userCompanyId) {
            $company = Company::find($userCompanyId);
        }
        if (!$company) {
            $company = Company::where('user_id', $user->id)->first();
        }

        $companyPayload = $company ? [
            'id' => $company->id,
            'name' => $company->name,
        ] : null;

        return [
            'id' => $user->id,
            'company_id' => $company?->id ?? $userCompanyId,
            'company' => $companyPayload,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'city' => $user->city,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'status' => $user->status,
            'role_model' => $user->roleModel ? [
                'id' => $user->roleModel->id,
                'name' => $user->roleModel->name,
                'slug' => $user->roleModel->slug,
                'permissions' => $user->roleModel->permissions ?? [],
            ] : null,
            'permissions' => $resolved['list'],
            'pos_access' => $resolved['pos_access'],
            'mobile_access' => $resolved['mobile_access'],
            'can_manage_users' => $resolved['can_manage_users'],
            'is_admin' => $resolved['is_admin'],
            'profileImage' => $this->resolveProfileImage($user),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }

    private function resolveProfileImage(User $user): array
    {
        if (!$user->profile_image_path) {
            return [];
        }

        $url = rtrim(config('app.url'), '/') . '/storage/' . ltrim($user->profile_image_path, '/');

        return [[
            'imageUrl' => $url,
            'fileName' => basename($user->profile_image_path),
        ]];
    }

    public function availablePermissions(): array
    {
        return [
            ['key' => 'sales.view', 'label' => 'Sales — view'],
            ['key' => 'sales.create', 'label' => 'Sales — create / edit'],
            ['key' => 'inventory.view', 'label' => 'Items / Inventory — view'],
            ['key' => 'inventory.edit', 'label' => 'Items / Inventory — edit'],
            ['key' => 'customers.view', 'label' => 'Customers — view'],
            ['key' => 'payments.create', 'label' => 'Payments & Expenses'],
            ['key' => 'purchasing.view', 'label' => 'Purchasing & Suppliers'],
            ['key' => 'shipping.view', 'label' => 'Shipping'],
            ['key' => 'offers.view', 'label' => 'Offers'],
            ['key' => 'repair.view', 'label' => 'Repair'],
            ['key' => 'reports.view', 'label' => 'Reports — view'],
            ['key' => 'settings.view', 'label' => 'Settings — view (company, items)'],
            ['key' => 'users.view', 'label' => 'Manage employee logins (admin only)'],
        ];
    }
}
