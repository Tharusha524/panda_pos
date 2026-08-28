<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerAdvancePayment;
use App\Models\CustomerType;
use App\Models\PosPayment;
use App\Models\Sale;
use App\Models\SalePaymentAllocation;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    private const ORDER_FIELDS = [
        'customer_id' => 'customer_code',
        'customer_name' => 'customer_name',
        'contact_no' => 'contact_no',
        'credit_limit' => 'credit_limit',
        'net_balance' => 'net_balance',
    ];

    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
        private PaymentService $paymentService,
        private PermissionService $permissionService,
        private CustomerBalanceService $customerBalanceService,
    ) {
    }

    public function getAllForUser(
        User $user,
        ?string $location = null,
        ?string $orderBy = null,
        ?string $sort = null
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $query = Customer::where('company_id', $companyId);

        $locFilter = $location && $location !== 'all' ? $location : null;
        if ($locFilter) {
            $query->where(function ($q) use ($locFilter) {
                $q->where('inventory_location', $locFilter)->orWhere('location', $locFilter);
            });
        }

        $orderColumn = self::ORDER_FIELDS[$orderBy ?? 'customer_id'] ?? 'customer_code';
        $direction = strtolower($sort ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($orderColumn, $direction);

        $customers = $query->get()->map(fn (Customer $c) => $this->formatCustomer($c));

        $summaryQuery = Customer::where('company_id', $companyId);
        if ($locFilter) {
            $summaryQuery->where(function ($q) use ($locFilter) {
                $q->where('inventory_location', $locFilter)->orWhere('location', $locFilter);
            });
        }

        $storedLocations = Customer::where('company_id', $companyId)
            ->select('inventory_location', 'location')
            ->get()
            ->flatMap(fn ($c) => array_filter([$c->inventory_location, $c->location]))
            ->unique()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany($companyId, $storedLocations);

        $debtorQuery = (clone $summaryQuery)->where('net_balance', '>', 0);

        return [
            'customers' => $customers,
            'summary' => [
                'total_customers' => $customers->count(),
                'debtor_count' => $debtorQuery->count(),
                'total_receivables' => round((float) $debtorQuery->sum('net_balance'), 2),
            ],
            'filters' => [
                'locations' => $locations,
            ],
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        return $this->formatCustomer($this->findForUser($user, $id), true);
    }

    public function getTypesForUser(User $user)
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return CustomerType::where('company_id', $company->id)
            ->orderBy('name')
            ->get()
            ->map(fn (CustomerType $t) => ['id' => $t->id, 'name' => $t->name]);
    }

    public function createTypeForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            throw new Exception('Customer type name is required');
        }

        if (CustomerType::where('company_id', $company->id)->where('name', $name)->exists()) {
            throw new Exception('Customer type already exists.');
        }

        $type = CustomerType::create(['company_id' => $company->id, 'name' => $name]);

        return ['id' => $type->id, 'name' => $type->name];
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $firstName = trim((string) ($data['first_name'] ?? $data['customer_name'] ?? ''));
        if ($firstName === '') {
            throw new Exception('Customer name is required');
        }

        $contact = trim((string) ($data['contact_no'] ?? ''));
        if ($contact === '') {
            throw new Exception('Phone number is required');
        }

        $allowDuplicate = (bool) ($data['allow_duplicate_phone'] ?? false);
        if (!$allowDuplicate) {
            $exists = Customer::where('company_id', $companyId)->where('contact_no', $contact)->exists();
            if ($exists) {
                throw new Exception('Phone number already exists for another customer.');
            }
        }

        $code = trim((string) ($data['customer_code'] ?? ''));
        if ($code === '') {
            $code = $this->nextCustomerCode($companyId);
        }

        if (Customer::where('company_id', $companyId)->where('customer_code', $code)->exists()) {
            throw new Exception('Customer ID already exists.');
        }

        $opening = (float) ($data['opening_balance'] ?? 0);
        $advance = (float) ($data['advance_payment'] ?? 0);
        $netBalance = $opening - $advance;

        $inventoryLocation = $this->locationService->assertValidForUser(
            $user,
            $data['inventory_location'] ?? $data['location'] ?? null
        );
        $businessName = trim((string) ($data['business_name'] ?? ''));

        $this->assertValidCustomerType($companyId, $data['customer_type_id'] ?? null);

        return DB::transaction(function () use ($data, $companyId, $code, $firstName, $businessName, $contact, $allowDuplicate, $opening, $advance, $netBalance, $inventoryLocation) {
            $customer = Customer::create($this->buildAttributes($data, [
                'company_id' => $companyId,
                'customer_code' => $code,
                'first_name' => $firstName,
                'business_name' => $businessName ?: null,
                'customer_name' => $this->buildDisplayName($firstName, $businessName),
                'contact_no' => $contact,
                'allow_duplicate_phone' => $allowDuplicate,
                'opening_balance' => $opening,
                'net_balance' => $netBalance,
                'inventory_location' => $inventoryLocation,
                'location' => $inventoryLocation,
            ]));

            if ($advance > 0) {
                CustomerAdvancePayment::create([
                    'customer_id' => $customer->id,
                    'amount' => $advance,
                    'notes' => $data['advance_payment_notes'] ?? null,
                ]);
            }

            return $this->formatCustomer($customer->fresh(), true);
        });
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $customer = $this->findForUser($user, $id);
        $companyId = $customer->company_id;

        if (array_key_exists('first_name', $data) || array_key_exists('customer_name', $data)) {
            $firstName = trim((string) ($data['first_name'] ?? $data['customer_name'] ?? $customer->first_name));
            if ($firstName === '') {
                throw new Exception('Customer name is required');
            }
            $customer->first_name = $firstName;
        }

        if (array_key_exists('business_name', $data)) {
            $customer->business_name = trim((string) $data['business_name']) ?: null;
        }

        $customer->customer_name = $this->buildDisplayName(
            $customer->first_name ?? $customer->customer_name,
            $customer->business_name
        );

        if (array_key_exists('contact_no', $data)) {
            $contact = trim((string) $data['contact_no']);
            if ($contact === '') {
                throw new Exception('Phone number is required');
            }
            $allowDuplicate = (bool) ($data['allow_duplicate_phone'] ?? $customer->allow_duplicate_phone);
            if (!$allowDuplicate) {
                $exists = Customer::where('company_id', $companyId)
                    ->where('contact_no', $contact)
                    ->where('id', '!=', $id)
                    ->exists();
                if ($exists) {
                    throw new Exception('Phone number already exists for another customer.');
                }
            }
            $customer->contact_no = $contact;
        }

        if (array_key_exists('customer_code', $data) && trim((string) $data['customer_code']) !== '') {
            $newCode = trim((string) $data['customer_code']);
            $exists = Customer::where('company_id', $companyId)
                ->where('customer_code', $newCode)
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                throw new Exception('Customer ID already exists.');
            }
            $customer->customer_code = $newCode;
        }

        $attrs = $this->buildAttributes($data, []);
        unset($attrs['company_id'], $attrs['customer_code'], $attrs['first_name'], $attrs['business_name'], $attrs['customer_name'], $attrs['contact_no'], $attrs['allow_duplicate_phone'], $attrs['opening_balance'], $attrs['net_balance']);

        foreach ($attrs as $key => $value) {
            if (array_key_exists($key, $data) || $this->fieldMappedInData($key, $data)) {
                $customer->{$key} = $value;
            }
        }

        if (array_key_exists('opening_balance', $data)) {
            $customer->opening_balance = (float) $data['opening_balance'];
            if (!array_key_exists('net_balance', $data)) {
                $advanceTotal = (float) $customer->advancePayments()->sum('amount');
                $customer->net_balance = $customer->opening_balance - $advanceTotal;
            }
        }

        if (array_key_exists('net_balance', $data)) {
            if (!$this->permissionService->canManageUsers($user)) {
                throw new Exception('You do not have permission to adjust customer balance directly.');
            }
            $customer->net_balance = (float) $data['net_balance'];
        }

        if (array_key_exists('customer_type_id', $data)) {
            $this->assertValidCustomerType($companyId, $data['customer_type_id']);
        }

        if (array_key_exists('inventory_location', $data) || array_key_exists('location', $data)) {
            $loc = $this->locationService->assertValidForUser(
                $user,
                $data['inventory_location'] ?? $data['location'] ?? $customer->inventory_location
            );
            $customer->inventory_location = $loc;
            $customer->location = $loc;
        }

        $customer->save();

        if (!empty($data['payment_received']) && (float) $data['payment_received'] > 0) {
            $payment = round((float) $data['payment_received'], 2);
            $outstanding = round((float) $customer->net_balance, 2);
            if ($outstanding <= 0) {
                throw new Exception('This customer has no outstanding credit balance.');
            }
            if ($payment > $outstanding + 0.01) {
                throw new Exception('Payment received cannot exceed outstanding balance.');
            }
            CustomerAdvancePayment::create([
                'customer_id' => $customer->id,
                'amount' => $payment,
                'notes' => $data['payment_received_notes'] ?? 'Debt collection',
            ]);
            $customer->net_balance = round($outstanding - $payment, 2);
            $customer->save();
        }

        if (!empty($data['advance_payment']) && (float) $data['advance_payment'] > 0 && ($data['apply_advance_on_update'] ?? false)) {
            $advance = (float) $data['advance_payment'];
            CustomerAdvancePayment::create([
                'customer_id' => $customer->id,
                'amount' => $advance,
                'notes' => $data['advance_payment_notes'] ?? null,
            ]);
            $customer->net_balance = (float) $customer->net_balance - $advance;
            $customer->save();
        }

        return $this->formatCustomer($customer->fresh(), true);
    }

    public function receivePaymentForUser(User $user, int $id, array $data): array
    {
        $customer = $this->findForUser($user, $id);

        return DB::transaction(function () use ($user, $customer, $data) {
            $payment = round((float) ($data['amount'] ?? 0), 2);
            if ($payment <= 0) {
                throw new Exception('Payment amount must be greater than zero.');
            }

            $locked = Customer::lockForUpdate()->find($customer->id);
            if (!$locked) {
                throw new Exception('Customer not found.');
            }

            $outstanding = round((float) $locked->net_balance, 2);
            if ($outstanding <= 0) {
                throw new Exception('This customer has no outstanding credit balance.');
            }
            if ($payment > $outstanding + 0.01) {
                throw new Exception('Payment cannot exceed outstanding balance of Rs '.number_format($outstanding, 2).'.');
            }

            $paymentMethod = trim((string) ($data['payment_method'] ?? 'Cash')) ?: 'Cash';
            if (strtolower($paymentMethod) === 'credit') {
                throw new Exception('Use Cash, Card, or another paid method to collect credit balance.');
            }

            $notes = trim((string) ($data['notes'] ?? '')) ?: 'Debt collection';
            $location = $this->locationService->assertValidForUser(
                $user,
                $data['location'] ?? $locked->inventory_location ?? $locked->location ?? null
            );
            // Both optional — a cheque payment can be recorded without either
            // filled in, same as the mobile screen allows.
            $chequeNumber = trim((string) ($data['cheque_number'] ?? '')) ?: null;
            $bankName = trim((string) ($data['bank_name'] ?? '')) ?: null;

            // Which specific old bill this payment settles — required: every
            // payment must be tied to a bill now, so it can't be used to
            // silently overpay one bill while under-crediting another, and
            // so Customer Settlement (which only shows bill-tied payments)
            // never misses one.
            if (empty($data['sale_id'])) {
                throw new Exception('Select which bill this payment is for.');
            }
            $bill = Sale::where('company_id', $locked->company_id)
                ->where('customer_id', $locked->id)
                ->where('id', (int) $data['sale_id'])
                ->lockForUpdate()
                ->first();
            if (!$bill) {
                throw new Exception('Selected bill was not found for this customer.');
            }
            // Capped against the *adjusted* outstanding (accounts for older
            // general payments made before bill selection was required —
            // see computeOutstandingBills), not the bill's raw remaining
            // amount, which can overstate what's really still owed on it.
            $adjustedBill = collect($this->computeOutstandingBills($locked))
                ->firstWhere('sale_id', $bill->id);
            $billOutstanding = $adjustedBill ? (float) $adjustedBill['outstanding_amount'] : 0.0;
            if ($billOutstanding <= 0.005) {
                throw new Exception('This bill is already fully settled.');
            }
            if ($payment > $billOutstanding + 0.01) {
                throw new Exception(
                    'Payment cannot exceed this bill\'s outstanding amount of Rs '.number_format($billOutstanding, 2).'.'
                );
            }

            CustomerAdvancePayment::create([
                'customer_id' => $locked->id,
                'amount' => $payment,
                'notes' => $notes,
            ]);

            $newBalance = round($outstanding - $payment, 2);
            $posPayment = $this->paymentService->recordCustomerPayment(
                $locked,
                $payment,
                $paymentMethod,
                $notes,
                $location,
                $chequeNumber,
                $bankName,
                $outstanding,
                $newBalance,
            );

            if ($bill) {
                SalePaymentAllocation::create([
                    'sale_id' => $bill->id,
                    'pos_payment_id' => $posPayment->id,
                    'amount' => $payment,
                ]);
            }

            $locked->net_balance = $newBalance;
            $locked->save();

            return [
                'customer' => $this->formatCustomer($locked->fresh(), true),
                'payment_received' => $payment,
                'previous_balance' => $outstanding,
                'new_balance' => (float) $locked->net_balance,
                'payment_method' => $paymentMethod,
                'cheque_number' => $chequeNumber,
                'bank_name' => $bankName,
                'bill_number' => $bill?->sales_id,
            ];
        });
    }

    /**
     * Individual outstanding credit bills for a customer — oldest first —
     * used by the Receive Payment "which bill" picker. Distinct from
     * Customer.net_balance (the overall total, unaffected by this).
     *
     * Reuses CustomerBalanceService::balanceDeltaForSale — the exact same
     * calculation that built net_balance in the first place — instead of a
     * simplified "plain credit sale" filter, so a bill appears here (for the
     * right amount) exactly when it actually added to what's owed. That
     * calculation already covers Exchanges (a credit exchange, or a
     * cash/card exchange that writes off a credit-sold return), not just
     * ordinary Sales — a hand-rolled filter here previously missed those.
     *
     * @return array<int, array<string, mixed>>
     */
    public function outstandingBillsForUser(User $user, int $customerId): array
    {
        $customer = $this->findForUser($user, $customerId);

        return $this->computeOutstandingBills($customer);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function computeOutstandingBills(Customer $customer): array
    {
        $sales = Sale::where('company_id', $customer->company_id)
            ->where('customer_id', $customer->id)
            ->where(function ($q) {
                $q->whereNull('order_status')
                    ->orWhere('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
            })
            ->withSum('paymentAllocations', 'amount')
            ->orderBy('sale_date')
            ->orderBy('id')
            ->get();

        $bills = [];
        foreach ($sales as $sale) {
            // A cheque-returned sale is owed regardless of its original
            // payment method — balanceDeltaForSale only recognizes Credit
            // sales/exchanges, so it wouldn't otherwise appear as a bill.
            $delta = $sale->cheque_returned
                ? round((float) $sale->net_amount, 2)
                : $this->customerBalanceService->balanceDeltaForSale($sale);
            // <= 0 covers returns and exchange write-offs, both of which
            // reduce what's owed rather than being a bill of their own.
            if ($delta <= 0.005) {
                continue;
            }
            $allocated = round((float) ($sale->payment_allocations_sum_amount ?? 0), 2);
            $outstanding = round($delta - $allocated, 2);
            if ($outstanding <= 0.005) {
                continue;
            }
            $bills[] = [
                'sale_id' => $sale->id,
                'bill_number' => $sale->sales_id,
                'date' => $sale->sale_date?->format('Y-m-d'),
                'bill_amount' => round($delta, 2),
                'paid_amount' => $allocated,
                'outstanding_amount' => $outstanding,
            ];
        }

        // Reconcile against the customer's real total: a "General payment"
        // made before bill selection was required reduces net_balance
        // without reducing any one bill's allocated amount, so the raw sum
        // above can overstate what's actually left on each bill. Squeeze
        // that gap out of the oldest bills first, so the list shown always
        // adds up to exactly what the customer really owes.
        $rawTotal = round(array_sum(array_column($bills, 'outstanding_amount')), 2);
        $trueTotal = round((float) $customer->net_balance, 2);
        $excess = round($rawTotal - $trueTotal, 2);

        if ($excess > 0.005) {
            foreach ($bills as &$bill) {
                if ($excess <= 0.005) {
                    break;
                }
                $apply = min($bill['outstanding_amount'], $excess);
                $bill['outstanding_amount'] = round($bill['outstanding_amount'] - $apply, 2);
                $excess = round($excess - $apply, 2);
            }
            unset($bill);
            $bills = array_values(array_filter($bills, fn ($b) => $b['outstanding_amount'] > 0.005));
        }

        return $bills;
    }

    /**
     * "Receive payment" records for a customer — for Customer History, which
     * otherwise only lists their sales. Scoped to source_type
     * CUSTOMER_PAYMENT specifically (money paid in later against the
     * account), not payments taken at the time of a sale — those already
     * show up as that sale's row, so including them here would double them up.
     *
     * @return array<int, array<string, mixed>>
     */
    public function paymentsForUser(User $user, int $customerId): array
    {
        $customer = $this->findForUser($user, $customerId);

        $payments = PosPayment::where('company_id', $customer->company_id)
            ->where('source_type', PaymentService::SOURCE_CUSTOMER_PAYMENT)
            ->where('source_id', $customer->id)
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get();

        $billNumberByPaymentId = SalePaymentAllocation::whereIn('pos_payment_id', $payments->pluck('id'))
            ->with('sale:id,sales_id')
            ->get()
            ->keyBy('pos_payment_id')
            ->map(fn (SalePaymentAllocation $a) => $a->sale?->sales_id);

        return $payments->map(fn (PosPayment $p) => [
            'id' => $p->id,
            'date' => $p->payment_date?->format('Y-m-d'),
            'reference' => $p->sales_no,
            'payment_method' => $p->payment_method,
            'cheque_number' => $p->cheque_number,
            'bank_name' => $p->bank_name,
            'amount' => round((float) $p->paid_amount, 2),
            'notes' => $p->notes,
            'bill_number' => $billNumberByPaymentId->get($p->id),
            // Null for payments recorded before this was tracked — the
            // reprint falls back to the customer's current balance then.
            'previous_balance' => $p->previous_balance !== null ? (float) $p->previous_balance : null,
            'new_balance' => $p->new_balance !== null ? (float) $p->new_balance : null,
            'is_returned' => (bool) $p->is_returned,
        ])->all();
    }

    /**
     * Cheque return (bounced cheque) — reverses a customer payment: undoes
     * whichever bill it was allocated to (that bill goes back to being
     * outstanding, and the payment drops out of the Customer Settlement
     * report automatically, since both read sale_payment_allocations
     * directly), adds the amount back to the customer's balance, and flags
     * the payment so it can't be returned twice.
     *
     * @return array<string, mixed>
     */
    public function markPaymentReturnedForUser(User $user, int $customerId, int $paymentId): array
    {
        $customer = $this->findForUser($user, $customerId);

        return DB::transaction(function () use ($customer, $paymentId) {
            $locked = Customer::lockForUpdate()->find($customer->id);
            if (!$locked) {
                throw new Exception('Customer not found.');
            }

            $payment = PosPayment::where('company_id', $locked->company_id)
                ->where('source_type', PaymentService::SOURCE_CUSTOMER_PAYMENT)
                ->where('source_id', $locked->id)
                ->where('id', $paymentId)
                ->lockForUpdate()
                ->first();
            if (!$payment) {
                throw new Exception('Payment not found for this customer.');
            }
            if ($payment->is_returned) {
                throw new Exception('This payment has already been marked as returned.');
            }

            SalePaymentAllocation::where('pos_payment_id', $payment->id)->delete();

            $previousBalance = round((float) $locked->net_balance, 2);
            $amount = round((float) $payment->paid_amount, 2);
            $locked->net_balance = round($previousBalance + $amount, 2);
            $locked->save();

            $payment->is_returned = true;
            $payment->returned_at = now();
            $payment->save();

            return [
                'customer' => $this->formatCustomer($locked->fresh(), true),
                'source' => 'payment',
                'reference' => $payment->sales_no,
                'cheque_number' => $payment->cheque_number,
                'bank_name' => $payment->bank_name,
                'amount_returned' => $amount,
                'previous_balance' => $previousBalance,
                'new_balance' => (float) $locked->net_balance,
            ];
        });
    }

    /**
     * Cheque return for a sale-time payment (as opposed to a Receive
     * Payment cheque — see markPaymentReturnedForUser above). The sale
     * itself (items, inventory, totals) is left untouched — only its
     * payment status flips: the amount is added back to the customer's
     * balance as credit owed, and it becomes a pickable bill in Receive
     * Payment (see outstandingBillsForUser, which treats a cheque-returned
     * sale as owed regardless of its original payment method).
     *
     * @return array<string, mixed>
     */
    public function markSaleChequeReturnedForUser(User $user, int $customerId, int $saleId): array
    {
        $customer = $this->findForUser($user, $customerId);

        return DB::transaction(function () use ($customer, $saleId) {
            $locked = Customer::lockForUpdate()->find($customer->id);
            if (!$locked) {
                throw new Exception('Customer not found.');
            }

            $sale = Sale::where('company_id', $locked->company_id)
                ->where('customer_id', $locked->id)
                ->where('id', $saleId)
                ->lockForUpdate()
                ->first();
            if (!$sale) {
                throw new Exception('Sale not found for this customer.');
            }
            if (strtolower(trim((string) $sale->payment_method)) !== 'cheque') {
                throw new Exception('Only cheque-paid sales can be marked as returned.');
            }
            if ($sale->cheque_returned) {
                throw new Exception('This cheque has already been marked as returned.');
            }

            $previousBalance = round((float) $locked->net_balance, 2);
            $amount = round((float) $sale->net_amount, 2);
            $locked->net_balance = round($previousBalance + $amount, 2);
            $locked->save();

            $sale->cheque_returned = true;
            $sale->cheque_returned_at = now();
            $sale->save();

            return [
                'customer' => $this->formatCustomer($locked->fresh(), true),
                'source' => 'sale',
                'reference' => $sale->sales_id,
                'cheque_number' => $sale->cheque_number,
                'bank_name' => $sale->bank?->name,
                'amount_returned' => $amount,
                'previous_balance' => $previousBalance,
                'new_balance' => (float) $locked->net_balance,
            ];
        });
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    private function fieldMappedInData(string $key, array $data): bool
    {
        return match ($key) {
            'inventory_location', 'location' => array_key_exists('inventory_location', $data) || array_key_exists('location', $data),
            default => false,
        };
    }

    private function assertValidCustomerType(int $companyId, mixed $customerTypeId): void
    {
        if ($customerTypeId === null || $customerTypeId === '') {
            return;
        }

        $exists = CustomerType::where('company_id', $companyId)
            ->where('id', (int) $customerTypeId)
            ->exists();
        if (!$exists) {
            throw new Exception('Invalid customer type for this company.');
        }
    }

    private function buildAttributes(array $data, array $overrides): array
    {
        return array_merge([
            'email' => $data['email'] ?? null,
            'date_of_birth' => !empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
            'passport_no' => $data['passport_no'] ?? null,
            'nic' => $data['nic'] ?? null,
            'address_line1' => $data['address_line1'] ?? null,
            'city' => $data['city'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country' => $data['country'] ?? 'Sri Lanka',
            'province' => $data['province'] ?? null,
            'source' => $data['source'] ?? '4',
            'sales_person_id' => $data['sales_person_id'] ?? null,
            'lead_sales_person' => $data['lead_sales_person'] ?? null,
            'other_sales_person' => $data['other_sales_person'] ?? null,
            'support_person' => $data['support_person'] ?? null,
            'customer_status' => $data['customer_status'] ?? 'Product',
            'product' => $data['product'] ?? null,
            'credit_limit' => (float) ($data['credit_limit'] ?? 0),
            'notes' => $data['notes'] ?? null,
            'language' => $data['language'] ?? null,
            'customer_type_id' => $data['customer_type_id'] ?? null,
            'customer_discount' => (float) ($data['customer_discount'] ?? 0),
            'route' => $data['route'] ?? null,
            'latitude' => isset($data['latitude']) && $data['latitude'] !== '' ? (float) $data['latitude'] : null,
            'longitude' => isset($data['longitude']) && $data['longitude'] !== '' ? (float) $data['longitude'] : null,
        ], $overrides);
    }

    private function buildDisplayName(string $firstName, ?string $businessName): string
    {
        $businessName = trim((string) $businessName);
        if ($businessName !== '') {
            return $firstName.' - '.$businessName;
        }

        return $firstName;
    }

    private function nextCustomerCode(int $companyId): string
    {
        $max = Customer::where('company_id', $companyId)
            ->whereRaw("customer_code REGEXP '^[0-9]+$'")
            ->selectRaw('MAX(CAST(customer_code AS UNSIGNED)) as max_num')
            ->value('max_num');

        return (string) max(1, ((int) $max) + 1);
    }

    private function findForUser(User $user, int $id): Customer
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $customer = Customer::where('company_id', $company->id)->where('id', $id)->first();

        if (!$customer) {
            throw new Exception('Customer not found');
        }

        return $customer;
    }

    private function formatCustomer(Customer $customer, bool $detailed = false): array
    {
        $base = [
            'id' => $customer->id,
            'customer_id' => $customer->customer_code,
            'customer_code' => $customer->customer_code,
            'customer_name' => $customer->customer_name,
            'first_name' => $customer->first_name ?? $customer->customer_name,
            'business_name' => $customer->business_name,
            'contact_no' => $customer->contact_no,
            'email' => $customer->email,
            'credit_limit' => (float) $customer->credit_limit,
            'opening_balance' => (float) ($customer->opening_balance ?? 0),
            'net_balance' => (float) $customer->net_balance,
            'location' => $customer->location ?? $customer->inventory_location,
            'inventory_location' => $customer->inventory_location ?? $customer->location,
            'route' => $customer->route,
            'latitude' => $customer->latitude !== null ? (float) $customer->latitude : null,
            'longitude' => $customer->longitude !== null ? (float) $customer->longitude : null,
        ];

        if (!$detailed) {
            return $base;
        }

        return array_merge($base, [
            'allow_duplicate_phone' => (bool) ($customer->allow_duplicate_phone ?? false),
            'date_of_birth' => $customer->date_of_birth?->format('Y-m-d'),
            'passport_no' => $customer->passport_no,
            'nic' => $customer->nic,
            'address_line1' => $customer->address_line1,
            'city' => $customer->city,
            'postal_code' => $customer->postal_code,
            'country' => $customer->country ?? 'Sri Lanka',
            'province' => $customer->province,
            'source' => $customer->source,
            'sales_person_id' => $customer->sales_person_id,
            'lead_sales_person' => $customer->lead_sales_person,
            'other_sales_person' => $customer->other_sales_person,
            'support_person' => $customer->support_person,
            'customer_status' => $customer->customer_status ?? 'Product',
            'product' => $customer->product,
            'notes' => $customer->notes,
            'language' => $customer->language,
            'customer_type_id' => $customer->customer_type_id,
            'customer_discount' => (float) ($customer->customer_discount ?? 0),
            'advance_payments_total' => (float) $customer->advancePayments()->sum('amount'),
        ]);
    }
}
