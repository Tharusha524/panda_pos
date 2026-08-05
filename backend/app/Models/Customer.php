<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $customer_code
 * @property string|null $customer_name
 * @property string|null $first_name
 * @property string|null $business_name
 * @property string|null $contact_no
 * @property bool $allow_duplicate_phone
 * @property string|null $email
 * @property Carbon|null $date_of_birth
 * @property string|null $passport_no
 * @property string|null $nic
 * @property string|null $address_line1
 * @property string|null $city
 * @property string|null $postal_code
 * @property string|null $country
 * @property string|null $province
 * @property string|null $source
 * @property int|null $sales_person_id
 * @property string|null $lead_sales_person
 * @property string|null $other_sales_person
 * @property string|null $support_person
 * @property string|null $customer_status
 * @property string|null $product
 * @property float|int|string|null $credit_limit
 * @property float|int|string|null $opening_balance
 * @property float|int|string|null $net_balance
 * @property string|null $notes
 * @property string|null $language
 * @property string|null $inventory_location
 * @property string|null $location
 * @property string|null $route
 * @property int|null $customer_type_id
 * @property float|int|string|null $customer_discount
 * @property-read Company|null $company
 * @property-read CustomerType|null $customerType
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CustomerAdvancePayment> $advancePayments
 */
class Customer extends Model
{
    protected $fillable = [
        'company_id',
        'customer_code',
        'customer_name',
        'first_name',
        'business_name',
        'contact_no',
        'allow_duplicate_phone',
        'email',
        'date_of_birth',
        'passport_no',
        'nic',
        'address_line1',
        'city',
        'postal_code',
        'country',
        'province',
        'source',
        'sales_person_id',
        'lead_sales_person',
        'other_sales_person',
        'support_person',
        'customer_status',
        'product',
        'credit_limit',
        'opening_balance',
        'net_balance',
        'notes',
        'language',
        'inventory_location',
        'location',
        'route',
        'customer_type_id',
        'customer_discount',
    ];

    protected $casts = [
        'allow_duplicate_phone' => 'boolean',
        'credit_limit' => 'decimal:2',
        'opening_balance' => 'decimal:2',
        'net_balance' => 'decimal:2',
        'customer_discount' => 'decimal:2',
        'date_of_birth' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customerType(): BelongsTo
    {
        return $this->belongsTo(CustomerType::class);
    }

    public function advancePayments(): HasMany
    {
        return $this->hasMany(CustomerAdvancePayment::class);
    }
}
