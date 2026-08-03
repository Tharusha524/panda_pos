<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $purpose
 * @property string $email
 * @property int|null $user_id
 * @property string $code_hash
 * @property int $attempts
 * @property \Illuminate\Support\Carbon|null $verified_at
 * @property \Illuminate\Support\Carbon $expires_at
 */
class OtpCode extends Model
{
    protected $fillable = [
        'purpose',
        'email',
        'user_id',
        'code_hash',
        'attempts',
        'verified_at',
        'expires_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
