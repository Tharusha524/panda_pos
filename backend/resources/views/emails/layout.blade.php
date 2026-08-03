<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? ($appName ?? 'POS') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                    <td style="background:{{ $brandColor ?? '#00327e' }};padding:20px 28px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>
                                    <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                                        {{ $appName ?? 'POS' }}
                                    </div>
                                    <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">
                                        {{ $tagline ?? 'Inventory alert notification' }}
                                    </div>
                                </td>
                                @if(!empty($isTest))
                                <td align="right" valign="middle">
                                    <span style="display:inline-block;background:#ffc107;color:#1a1a1a;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.04em;">
                                        Test
                                    </span>
                                </td>
                                @endif
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px;">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 28px 24px;border-top:1px solid #e8ecf1;background:#fafbfc;">
                        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                            Sent by {{ $appName ?? 'POS' }}@if(!empty($companyName)) for {{ $companyName }}@endif.
                            @if(!empty($generatedAt))
                                Generated {{ $generatedAt }}.
                            @endif
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
