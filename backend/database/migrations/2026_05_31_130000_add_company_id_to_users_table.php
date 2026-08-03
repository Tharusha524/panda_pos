<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
        });

        User::query()->each(function (User $user) {
            $ownedCompany = Company::where('user_id', $user->id)->first();
            if ($ownedCompany) {
                $user->update(['company_id' => $ownedCompany->id]);

                return;
            }

            $admin = User::query()
                ->where(function ($q) {
                    $q->where('role', 'admin')
                        ->orWhereHas('roleModel', fn ($r) => $r->where('slug', 'admin'));
                })
                ->orderBy('id')
                ->first();

            if (!$admin) {
                return;
            }

            $adminCompany = Company::where('user_id', $admin->id)->first();
            if ($adminCompany) {
                $user->update(['company_id' => $adminCompany->id]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
