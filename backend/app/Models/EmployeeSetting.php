<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSetting extends Model
{
    protected $fillable = [
        'user_id',
        'allow_employee_auto_number',
    ];

    protected function casts(): array
    {
        return [
            'allow_employee_auto_number' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
