<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'slug')) {
                $table->string('slug', 80)->nullable()->unique()->after('name');
            }
            if (!Schema::hasColumn('companies', 'status')) {
                $table->string('status', 20)->default('active')->after('slug');
            }
            if (!Schema::hasColumn('companies', 'plan')) {
                $table->string('plan', 50)->default('standard')->after('status');
            }
            if (!Schema::hasColumn('companies', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable()->after('plan');
            }
        });

        $companies = DB::table('companies')->select('id', 'name', 'slug')->get();
        foreach ($companies as $row) {
            if (!empty($row->slug)) {
                continue;
            }
            $base = Str::slug((string) $row->name) ?: 'shop-'.$row->id;
            $slug = $base;
            $n = 0;
            while (
                DB::table('companies')
                    ->where('slug', $slug)
                    ->where('id', '!=', $row->id)
                    ->exists()
            ) {
                $n++;
                $slug = $base.'-'.$n;
            }
            DB::table('companies')->where('id', $row->id)->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $cols = ['slug', 'status', 'plan', 'trial_ends_at'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('companies', $c));
            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });
    }
};
