<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'company_id')) {
            return;
        }

        $primary = Company::query()->orderBy('id')->first();
        if (!$primary) {
            return;
        }

        if (Company::query()->count() === 1) {
            User::query()->update(['company_id' => $primary->id]);

            return;
        }

        User::query()
            ->whereNull('company_id')
            ->update(['company_id' => $primary->id]);
    }

    public function down(): void
    {
        // Non-destructive backfill — no rollback
    }
};
