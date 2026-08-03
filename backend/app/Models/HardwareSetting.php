<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HardwareSetting extends Model
{
    protected $fillable = [
        'user_id',
        'printing_paper_size',
        'sales_receipt_printout_style',
        'allow_auto_print',
        'allow_multiple_printers',
        'allow_customer_display',
        'allow_company_details_receipt',
        'allow_custom_header_on_sales_receipt',
        'custom_header_name',
        'custom_header_address',
        'custom_header_phone',
        'allow_dual_language_print',
        'show_barcode_on_sales_receipt',
        'show_item_uom_on_sales_receipt',
        'allow_customer_details_on_sales_receipt',
        'allow_discount_on_sales_receipt',
        'allow_logo_on_sales_receipt',
        'customize_label_for_discount',
        'letterhead_top_margin_cm',
        'logo_80mm_path',
        'logo_a4_a5_path',
    ];

    protected function casts(): array
    {
        return [
            'allow_auto_print' => 'boolean',
            'allow_multiple_printers' => 'boolean',
            'allow_customer_display' => 'boolean',
            'allow_company_details_receipt' => 'boolean',
            'allow_custom_header_on_sales_receipt' => 'boolean',
            'allow_dual_language_print' => 'boolean',
            'show_barcode_on_sales_receipt' => 'boolean',
            'show_item_uom_on_sales_receipt' => 'boolean',
            'allow_customer_details_on_sales_receipt' => 'boolean',
            'allow_discount_on_sales_receipt' => 'boolean',
            'allow_logo_on_sales_receipt' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
