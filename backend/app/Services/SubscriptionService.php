<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Str;

class SubscriptionService
{
    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function canAccess(User $user): bool
    {
        $subscription = $this->getOrCreateSubscription($user);

        if ($subscription->status !== 'active') {
            return false;
        }

        return !Carbon::today()->gt($subscription->next_payment_date);
    }

    public function getStatusForUser(User $user): array
    {
        $subscription = $this->getOrCreateSubscription($user);
        $canAccess = $this->canAccess($user);

        return [
            'can_access' => $canAccess,
            'is_overdue' => !$canAccess,
            'next_payment_date' => $subscription->next_payment_date->format('Y-m-d'),
            'message' => $canAccess
                ? 'Subscription is active.'
                : 'Monthly payment is overdue. Please pay online to restore access.',
        ];
    }

    public function getDetailsForUser(User $user): array
    {
        $subscription = $this->getOrCreateSubscription($user);
        $subscription->load(['payments' => fn ($q) => $q->orderByDesc('paid_at')]);

        $status = $this->getStatusForUser($user);

        return array_merge($status, [
            'cloud_id' => $subscription->cloud_id,
            'license_count' => (int) $subscription->license_count,
            'product_name' => $subscription->product_name,
            'period_start' => $subscription->period_start->format('Y-m-d'),
            'period_end' => $subscription->period_end->format('Y-m-d'),
            'period_start_display' => $subscription->period_start->format('d-m-Y'),
            'period_end_display' => $subscription->period_end->format('d-m-Y'),
            'monthly_charge' => (float) $subscription->monthly_charge,
            'next_payment_date_display' => $subscription->next_payment_date->format('d-m-Y'),
            'billing_history' => $subscription->payments->map(fn (SubscriptionPayment $p) => [
                'id' => $p->id,
                'date' => $p->paid_at->format('d-m-Y'),
                'card_type' => $p->card_type,
                'card_number' => $p->card_last_four ? '****'.$p->card_last_four : '—',
                'amount' => (float) $p->amount,
                'amount_display' => 'Rs '.number_format((float) $p->amount, 2),
            ])->values()->all(),
        ]);
    }

    public function recordOnlinePayment(User $user, array $data): array
    {
        $subscription = $this->getOrCreateSubscription($user);

        $amount = array_key_exists('amount', $data)
            ? (float) $data['amount']
            : (float) $subscription->monthly_charge;

        $monthlyCharge = round((float) $subscription->monthly_charge, 2);
        if ($amount < $monthlyCharge) {
            throw new Exception('Payment amount must be at least Rs '.number_format($monthlyCharge, 2).'.');
        }

        $cardNumber = preg_replace('/\D/', '', (string) ($data['card_number'] ?? ''));
        if (strlen($cardNumber) < 4) {
            throw new Exception('Enter a valid card number.');
        }

        $cardLastFour = substr($cardNumber, -4);
        $cardType = $data['card_type'] ?? $this->detectCardType($cardNumber);

        SubscriptionPayment::create([
            'subscription_id' => $subscription->id,
            'paid_at' => Carbon::today(),
            'card_type' => $cardType,
            'card_last_four' => $cardLastFour,
            'amount' => $amount,
            'payment_method' => 'online',
        ]);

        $base = Carbon::today()->gt($subscription->next_payment_date)
            ? Carbon::today()
            : $subscription->next_payment_date->copy();

        $subscription->update([
            'next_payment_date' => $base->addMonth(),
            'status' => 'active',
        ]);

        return $this->getDetailsForUser($user);
    }

    private function getOrCreateSubscription(User $user): Subscription
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $existing = Subscription::where('company_id', $company->id)->first();
        if ($existing) {
            return $existing;
        }

        $cloudId = 2000 + (int) $company->id;
        while (Subscription::where('cloud_id', $cloudId)->exists()) {
            $cloudId++;
        }

        $start = Carbon::today();
        $end = $start->copy()->addYear();

        return Subscription::create([
            'company_id' => $company->id,
            'cloud_id' => $cloudId,
            'product_name' => 'Sky Smart Software',
            'license_count' => 1,
            'period_start' => $start,
            'period_end' => $end,
            'monthly_charge' => 0,
            'next_payment_date' => $start->copy()->addMonth(),
            'status' => 'active',
        ]);
    }

    private function detectCardType(string $digits): string
    {
        if (Str::startsWith($digits, '4')) {
            return 'Visa';
        }
        if (Str::startsWith($digits, ['51', '52', '53', '54', '55'])) {
            return 'Mastercard';
        }

        return 'Card';
    }
}
