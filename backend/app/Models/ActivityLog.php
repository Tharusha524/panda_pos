<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    /**
     * The attributes that are mass assignable.
     *
    * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'description',
        'ip_address',
        'user_agent',
        'changes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'changes' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an activity.
     *
     * @param string $action
     * @param string|null $modelType
     * @param int|null $modelId
     * @param string|null $description
     * @param array|null $changes
     * @return ActivityLog
     */
    public static function log(
        string $action,
        ?string $modelType = null,
        ?int $modelId = null,
        ?string $description = null,
        ?array $changes = null
    ): ActivityLog {
        return self::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'changes' => $changes,
        ]);
    }

    /**
     * Get recent activity logs.
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function recent(int $limit = 50)
    {
        return self::latest()->take($limit)->get();
    }

    /**
     * Get activity logs for a specific user.
     *
     * @param int $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function forUser(int $userId, int $limit = 50)
    {
        return self::where('user_id', $userId)->latest()->take($limit)->get();
    }

    /**
     * Get activity logs for a specific model.
     *
     * @param string $modelType
     * @param int $modelId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function forModel(string $modelType, int $modelId, int $limit = 50)
    {
        return self::where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->latest()
            ->take($limit)
            ->get();
    }
}
