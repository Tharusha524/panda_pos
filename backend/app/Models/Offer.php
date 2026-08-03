<?php

namespace App\Models;

use Carbon\Carbon;
use App\Models\ItemBatch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $name
 * @property string|null $description
 * @property string|null $image_path
 * @property bool $days_of_week_enabled
 * @property array<int, string> $days_of_week
 * @property bool $expiration_enabled
 * @property Carbon|null $expiration_date
 * @property string|null $discount_type
 * @property string|null $pricing_mode
 * @property array<string, mixed> $discount_rules
 * @property bool $is_active
 * @property Carbon|null $created_at
 */
class Offer extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'description',
        'image_path',
        'days_of_week_enabled',
        'days_of_week',
        'expiration_enabled',
        'expiration_date',
        'discount_type',
        'pricing_mode',
        'discount_rules',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week_enabled' => 'boolean',
            'days_of_week' => 'array',
            'expiration_enabled' => 'boolean',
            'expiration_date' => 'date',
            'discount_rules' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'offer_items')->withTimestamps();
    }

    public function itemBatches(): BelongsToMany
    {
        return $this->belongsToMany(ItemBatch::class, 'offer_item_batches')->withTimestamps();
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
