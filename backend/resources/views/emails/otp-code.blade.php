@extends('emails.layout')

@section('content')
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
        Hello <strong>{{ $recipientName }}</strong>,
    </p>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
        @if($purpose === 'email_change')
            Use the code below to verify this email address and complete your email change request.
        @else
            Use the code below to reset your password.
        @endif
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
        <tr>
            <td style="background:#eef4ff;border:1px solid #c7d7fe;border-radius:8px;padding:16px 28px;">
                <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#1d4ed8;text-align:center;">
                    {{ $code }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">
        This code expires in {{ $expiresInMinutes }} minutes. If you didn't request this, you can safely ignore this email.
    </p>
@endsection
