@extends('emails.layout')

@section('content')
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
        Hello <strong>{{ $recipientName }}</strong>,
    </p>

    @if($isTest)
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
            This is a <strong>test notification</strong> from your POS alert system. When real alerts exist, the summary below will reflect your live inventory.
        </p>
    @else
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
            Here is your inventory alert summary. Review items in POS → <strong>Inventory</strong> or the bell icon.
        </p>
    @endif

    @php
        $toneStyles = [
            'error' => ['bg' => '#fdecea', 'border' => '#f5c2c0', 'text' => '#b42318', 'badge' => '#d92d20'],
            'warning' => ['bg' => '#fff8e6', 'border' => '#ffe08a', 'text' => '#b54708', 'badge' => '#f79009'],
            'info' => ['bg' => '#eef4ff', 'border' => '#c7d7fe', 'text' => '#1d4ed8', 'badge' => '#3b82f6'],
            'success' => ['bg' => '#ecfdf3', 'border' => '#abefc6', 'text' => '#027a48', 'badge' => '#12b76a'],
        ];
    @endphp

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
        <tr>
            @foreach($summaryRows as $row)
                @php $style = $toneStyles[$row['tone']] ?? $toneStyles['info']; @endphp
                <td style="padding:4px;">
                    <div style="background:{{ $style['bg'] }};border:1px solid {{ $style['border'] }};border-radius:8px;padding:12px 10px;text-align:center;min-width:90px;">
                        <div style="font-size:22px;font-weight:700;color:{{ $style['badge'] }};line-height:1.2;">
                            {{ $row['count'] }}
                        </div>
                        <div style="font-size:11px;font-weight:600;color:{{ $style['text'] }};margin-top:4px;text-transform:uppercase;letter-spacing:0.03em;">
                            {{ $row['label'] }}
                        </div>
                    </div>
                </td>
            @endforeach
        </tr>
    </table>

    @foreach($alertSections as $section)
        @php $style = $toneStyles[$section['tone']] ?? $toneStyles['info']; @endphp
        <div style="margin-bottom:20px;border:1px solid {{ $style['border'] }};border-radius:8px;overflow:hidden;">
            <div style="background:{{ $style['bg'] }};padding:12px 16px;border-bottom:1px solid {{ $style['border'] }};">
                <div style="font-size:14px;font-weight:700;color:{{ $style['text'] }};">
                    {{ $section['title'] }}
                    <span style="font-weight:600;opacity:0.85;">({{ $section['count'] }})</span>
                </div>
                <div style="font-size:13px;color:#374151;margin-top:4px;line-height:1.5;">
                    {{ $section['message'] }}
                </div>
            </div>

            @if(!empty($section['items']))
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
                    <tr style="background:#f9fafb;">
                        <td style="padding:8px 12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Item</td>
                        <td style="padding:8px 12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Location</td>
                        <td style="padding:8px 12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;text-align:right;">Qty</td>
                    </tr>
                    @foreach($section['items'] as $item)
                        <tr>
                            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;">
                                <div style="font-weight:600;">{{ $item['item_number'] ?? '—' }}</div>
                                <div style="color:#6b7280;font-size:12px;margin-top:2px;">{{ $item['description'] ?? '' }}</div>
                            </td>
                            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">
                                {{ $item['location'] ?? '—' }}
                            </td>
                            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-weight:600;">
                                {{ $item['qty'] ?? 0 }} {{ $item['uom'] ?? '' }}
                            </td>
                        </tr>
                    @endforeach
                </table>
                @if(($section['moreCount'] ?? 0) > 0)
                    <div style="padding:10px 16px;font-size:12px;color:#6b7280;background:#fafbfc;">
                        … and {{ $section['moreCount'] }} more item(s). Open POS for the full list.
                    </div>
                @endif
            @endif
        </div>
    @endforeach

    @if($alertSections === [])
        <div style="background:#ecfdf3;border:1px solid #abefc6;border-radius:8px;padding:16px;font-size:14px;color:#027a48;margin-bottom:20px;">
            No active inventory alerts at this time.
        </div>
    @endif

    @if(!empty($posUrl))
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:8px;">
            <tr>
                <td style="border-radius:6px;background:{{ $brandColor }};">
                    <a href="{{ $posUrl }}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Open POS
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection
