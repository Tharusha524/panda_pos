<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class StorageUrl
{
    public static function publicUrl(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
