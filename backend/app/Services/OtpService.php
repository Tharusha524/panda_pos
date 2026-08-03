<?php

namespace App\Services;

use App\Mail\OtpCodeMail;
use App\Models\OtpCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    private const EXPIRES_MINUTES = 10;
    private const VERIFIED_WINDOW_MINUTES = 15;
    private const MAX_ATTEMPTS = 5;

    /** Generate a fresh OTP for (purpose, email), replacing any pending one, and email it. */
    public function issue(string $purpose, string $email, ?int $userId, string $recipientName): void
    {
        OtpCode::where('email', $email)->where('purpose', $purpose)->delete();

        $code = (string) random_int(100000, 999999);

        OtpCode::create([
            'purpose' => $purpose,
            'email' => $email,
            'user_id' => $userId,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(self::EXPIRES_MINUTES),
        ]);

        Mail::to($email)->send(new OtpCodeMail($code, $purpose, $recipientName, self::EXPIRES_MINUTES));
    }

    /** Check the submitted code; marks the OTP as verified on success (does not consume it yet). */
    public function verify(string $purpose, string $email, string $code): bool
    {
        $otp = OtpCode::where('email', $email)->where('purpose', $purpose)->latest('id')->first();

        if (!$otp || $otp->expires_at->isPast()) {
            return false;
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            return false;
        }

        if (!Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');

            return false;
        }

        $otp->update(['verified_at' => now()]);

        return true;
    }

    /** Final step: confirms (purpose, email) was verified recently, then deletes the OTP so it can't be reused. */
    public function consumeIfVerified(string $purpose, string $email): bool
    {
        $otp = OtpCode::where('email', $email)->where('purpose', $purpose)->latest('id')->first();

        if (!$otp || !$otp->verified_at) {
            return false;
        }

        $stillValid = $otp->verified_at->copy()->addMinutes(self::VERIFIED_WINDOW_MINUTES)->isFuture();
        $otp->delete();

        return $stillValid;
    }
}
