<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose, // 'password_reset' | 'email_change'
        public string $recipientName,
        public int $expiresInMinutes,
    ) {
    }

    public function build(): self
    {
        $isEmailChange = $this->purpose === 'email_change';

        return $this
            ->subject($isEmailChange ? 'Your email change verification code' : 'Your password reset code')
            ->view('emails.otp-code')
            ->with([
                'code' => $this->code,
                'purpose' => $this->purpose,
                'recipientName' => $this->recipientName,
                'expiresInMinutes' => $this->expiresInMinutes,
                'appName' => config('app.name', 'POS'),
                'tagline' => $isEmailChange ? 'Email verification code' : 'Password reset code',
            ]);
    }
}
