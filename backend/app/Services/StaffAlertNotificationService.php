<?php

namespace App\Services;

use App\Models\AlertSetting;
use App\Models\Company;
use App\Models\CompanyNotificationSetting;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;

class StaffAlertNotificationService
{
    public function __construct(
        private AlertSettingService $alertSettingService,
        private SystemAlertService $systemAlertService,
        private SmsGatewayService $smsGatewayService,
        private SmsConfigService $smsConfigService,
        private CompanySettingService $companySettingService,
        private CompanyNotificationSettingService $companyNotificationSettingService,
        private CompanyMailService $companyMailService,
        private AlertNotificationTemplateService $alertNotificationTemplateService,
    ) {
    }

    /**
     * Test: send to the requesting user using company mail/SMS setup.
     *
     * @return array<string, mixed>
     */
    public function sendTestNotification(User $user): array
    {
        return $this->deliverToUser($user, force: true);
    }

    /**
     * Owner test: send to company main email/phone using company setup.
     *
     * @return array<string, mixed>
     */
    public function sendCompanyOwnerTest(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $this->companyNotificationSettingService->assertCanConfigure($user, $company);

        $companySetting = $this->companyNotificationSettingService->getOrCreateSetting($company);
        $alerts = $this->systemAlertService->getAlertsForUser($user);
        $messages = $this->buildMessages($company->name, $alerts, true, $company->name);

        $result = [
            'email_sent' => false,
            'sms_sent' => false,
            'email' => null,
            'phone' => null,
            'errors' => [],
        ];

        if ($companySetting->send_email) {
            $email = $company->email;
            if (!$email) {
                $result['errors'][] = 'Set company email in Settings → Company → Manage company.';
            } else {
                try {
                    $this->sendEmailViaCompany(
                        $companySetting,
                        $email,
                        $messages['email_subject'],
                        $messages['email_html'],
                        $messages['email_text'],
                    );
                    $result['email_sent'] = true;
                    $result['email'] = $email;
                } catch (\Throwable $e) {
                    $result['errors'][] = 'Email failed: ' . $e->getMessage();
                }
            }
        }

        if ($companySetting->send_sms) {
            $phone = $company->phone;
            if (!$phone) {
                $result['errors'][] = 'Set company phone in Settings → Company → Manage company.';
            } else {
                try {
                    $gateway = $this->smsConfigService->resolveForCompany($company);
                    if (!$gateway) {
                        throw new Exception('Configure SMS API URL in company alert notifications.');
                    }
                    $this->smsGatewayService->sendWithGateway($gateway, $phone, $messages['sms_body']);
                    $result['sms_sent'] = true;
                    $result['phone'] = $phone;
                    if (($gateway['provider'] ?? '') === 'log') {
                        $result['sms_mode'] = 'log';
                    }
                } catch (\Throwable $e) {
                    $result['errors'][] = 'SMS failed: ' . $e->getMessage();
                }
            }
        }

        if (!$companySetting->send_email && !$companySetting->send_sms) {
            throw new Exception('Enable company email or SMS sending in company alert notifications.');
        }

        if (!$result['email_sent'] && !$result['sms_sent'] && $result['errors'] !== []) {
            throw new Exception(implode(' ', $result['errors']));
        }

        return $result;
    }

    public function sendDailyDigestIfDue(User $user): bool
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companySetting = $this->companyNotificationSettingService->getOrCreateSetting($company);

        if (!$companySetting->alerts_enabled || !$companySetting->daily_digest) {
            return false;
        }

        $targets = $this->alertSettingService->getStaffDeliveryTargets($user);
        if (!$targets['send_email'] && !$targets['send_sms']) {
            return false;
        }

        if (!$companySetting->notify_employees) {
            return false;
        }

        $setting = AlertSetting::where('user_id', $user->id)->first();
        if ($setting?->staff_last_notified_at?->isToday()) {
            return false;
        }

        $alerts = $this->systemAlertService->getAlertsForUser($user);
        if (($alerts['total_count'] ?? 0) <= 0) {
            return false;
        }

        if (!$companySetting->send_email && !$companySetting->send_sms) {
            return false;
        }

        $this->deliverToUser($user, force: false);

        return true;
    }

    public function sendDailyDigestToOwner(Company $company): bool
    {
        $companySetting = $this->companyNotificationSettingService->getOrCreateSetting($company);
        if (!$companySetting->alerts_enabled || !$companySetting->daily_digest || !$companySetting->notify_owner) {
            return false;
        }

        if ($companySetting->last_broadcast_at?->isToday()) {
            return false;
        }

        $ownerUser = User::find($company->user_id) ?? User::where('company_id', $company->id)->first();
        if (!$ownerUser) {
            return false;
        }

        $alerts = $this->systemAlertService->getAlertsForUser($ownerUser);
        if (($alerts['total_count'] ?? 0) <= 0) {
            return false;
        }

        $messages = $this->buildMessages($company->name, $alerts, false, $company->name);
        $sent = false;

        if ($companySetting->send_email && $company->email) {
            try {
                $this->sendEmailViaCompany(
                    $companySetting,
                    $company->email,
                    $messages['email_subject'],
                    $messages['email_html'],
                    $messages['email_text'],
                );
                $sent = true;
            } catch (\Throwable $e) {
                Log::error('Owner alert email failed', ['company_id' => $company->id, 'error' => $e->getMessage()]);
            }
        }

        if ($companySetting->send_sms && $company->phone) {
            try {
                $gateway = $this->smsConfigService->resolveForCompany($company);
                if ($gateway) {
                    $this->smsGatewayService->sendWithGateway($gateway, $company->phone, $messages['sms_body']);
                    $sent = true;
                }
            } catch (\Throwable $e) {
                Log::error('Owner alert SMS failed', ['company_id' => $company->id, 'error' => $e->getMessage()]);
            }
        }

        if ($sent) {
            $this->companyNotificationSettingService->markBroadcast($company);
        }

        return $sent;
    }

    /**
     * @return array<string, mixed>
     */
    private function deliverToUser(User $user, bool $force): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companySetting = $this->companyNotificationSettingService->getOrCreateSetting($company);

        if (!$companySetting->alerts_enabled) {
            throw new Exception('Company alert notifications are disabled. Ask the owner to enable them.');
        }

        $targets = $this->alertSettingService->getStaffDeliveryTargets($user);
        $alerts = $this->systemAlertService->getAlertsForUser($user);
        $messages = $this->buildMessages($user->name, $alerts, $force, $company->name);

        $result = [
            'email_sent' => false,
            'sms_sent' => false,
            'email' => null,
            'phone' => null,
            'errors' => [],
        ];

        if ($targets['send_email']) {
            if (!$companySetting->send_email) {
                $result['errors'][] = 'Company email sending is not configured by the owner yet.';
            } else {
                $email = $targets['email'];
                if (!$email) {
                    $result['errors'][] = 'Add your email in Settings → User → Profile.';
                } else {
                    try {
                        $this->sendEmailViaCompany(
                        $companySetting,
                        $email,
                        $messages['email_subject'],
                        $messages['email_html'],
                        $messages['email_text'],
                    );
                        $result['email_sent'] = true;
                        $result['email'] = $email;
                    } catch (\Throwable $e) {
                        Log::error('Staff alert email failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                        $result['errors'][] = 'Email failed: ' . $e->getMessage();
                    }
                }
            }
        }

        if ($targets['send_sms']) {
            if (!$companySetting->send_sms) {
                $result['errors'][] = 'Company SMS sending is not configured by the owner yet.';
            } else {
                $phone = $targets['phone'];
                if (!$phone) {
                    $result['errors'][] = 'Add your phone in Settings → User → Profile.';
                } else {
                    try {
                        $gateway = $this->smsConfigService->resolveForUser($user);
                        if (!$gateway) {
                            $status = $this->smsConfigService->statusForUser($user);
                            throw new Exception($status['hint']);
                        }
                        $this->smsGatewayService->sendWithGateway($gateway, $phone, $messages['sms_body']);
                        $result['sms_sent'] = true;
                        $result['phone'] = $phone;
                        if (($gateway['provider'] ?? '') === 'log') {
                            $result['sms_mode'] = 'log';
                        }
                    } catch (\Throwable $e) {
                        Log::error('Staff alert SMS failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                        $result['errors'][] = 'SMS failed: ' . $e->getMessage();
                    }
                }
            }
        }

        if (!$targets['send_email'] && !$targets['send_sms']) {
            throw new Exception('Enable receive email or SMS in your Alert settings.');
        }

        if (!$force && ($result['email_sent'] || $result['sms_sent'])) {
            $this->alertSettingService->markStaffNotified($user);
        }

        if (!$result['email_sent'] && !$result['sms_sent'] && $result['errors'] !== []) {
            throw new Exception(implode(' ', $result['errors']));
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $alerts
     * @return array{email_subject: string, email_html: string, email_text: string, sms_body: string}
     */
    private function buildMessages(string $recipientName, array $alerts, bool $isTest, ?string $companyName = null): array
    {
        return $this->alertNotificationTemplateService->build($recipientName, $alerts, $isTest, $companyName);
    }

    private function sendEmailViaCompany(
        CompanyNotificationSetting $companySetting,
        string $to,
        string $subject,
        string $htmlBody,
        ?string $textBody = null,
    ): void {
        $this->companyMailService->send($companySetting, $to, $subject, $htmlBody, $textBody);
    }
}
