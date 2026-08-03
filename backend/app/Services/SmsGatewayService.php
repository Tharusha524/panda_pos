<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsGatewayService
{
    /**
     * @param array<string, mixed> $gateway
     */
    public function sendWithGateway(array $gateway, string $to, string $message): void
    {
        $provider = $gateway['provider'] ?? 'http';

        match ($provider) {
            'log' => $this->sendLog($to, $message),
            'twilio' => $this->sendTwilio(
                (string) ($gateway['account_sid'] ?? ''),
                (string) ($gateway['auth_token'] ?? ''),
                (string) ($gateway['from'] ?? ''),
                $to,
                $message,
            ),
            default => $this->sendHttp(
                (string) ($gateway['url'] ?? ''),
                isset($gateway['key']) ? (string) $gateway['key'] : null,
                $to,
                $message,
            ),
        };
    }

    private function normalizePhone(string $to): string
    {
        $phone = preg_replace('/[^\d+]/', '', $to);
        if ($phone === '') {
            throw new Exception('SMS phone number is required.');
        }

        return $phone;
    }

    private function truncateMessage(string $message): string
    {
        if (strlen($message) > 480) {
            return substr($message, 0, 477) . '...';
        }

        return $message;
    }

    private function sendLog(string $to, string $message): void
    {
        Log::info('[POS SMS - test mode]', [
            'to' => $this->normalizePhone($to),
            'message' => $this->truncateMessage($message),
        ]);
    }

    /**
     * Send SMS via HTTP gateway (JSON POST).
     */
    public function sendHttp(string $apiUrl, ?string $apiKey, string $to, string $message): void
    {
        if ($apiUrl === '') {
            throw new Exception('SMS API URL is not configured.');
        }

        $phone = $this->normalizePhone($to);
        $message = $this->truncateMessage($message);

        $payload = [
            'to' => $phone,
            'message' => $message,
            'text' => $message,
            'recipient' => $phone,
        ];

        if ($apiKey) {
            $payload['api_key'] = $apiKey;
            $payload['key'] = $apiKey;
        }

        $response = Http::timeout(20)
            ->acceptJson()
            ->post($apiUrl, $payload);

        if (!$response->successful()) {
            Log::warning('SMS gateway HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('SMS provider returned an error. Check API URL and key.');
        }
    }

    private function sendTwilio(
        string $accountSid,
        string $authToken,
        string $from,
        string $to,
        string $message,
    ): void {
        if ($accountSid === '' || $authToken === '' || $from === '') {
            throw new Exception('Twilio is not fully configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in .env.');
        }

        $phone = $this->normalizePhone($to);
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . ltrim($phone, '0');
        }

        $response = Http::timeout(20)
            ->withBasicAuth($accountSid, $authToken)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'To' => $phone,
                'From' => $from,
                'Body' => $this->truncateMessage($message),
            ]);

        if (!$response->successful()) {
            Log::warning('Twilio SMS error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('Twilio SMS failed: ' . ($response->json('message') ?? $response->body()));
        }
    }
}
