<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vat_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('vat_code', 50);
            $table->string('vat_desc', 255);
            $table->decimal('vat_rate', 8, 2)->default(0);
            $table->timestamps();

            $table->unique(['company_id', 'vat_code']);
        });

        Schema::create('tax_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->boolean('allow_vat')->default(false);
            $table->foreignId('default_vat_rate_id')->nullable()->constrained('vat_rates')->nullOnDelete();
            $table->string('vat_type', 20)->default('none');
            $table->timestamps();

            $table->unique('company_id');
        });

        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'vat_rate_id')) {
                $table->foreignId('vat_rate_id')->nullable()->after('item_sub_category_id')->constrained('vat_rates')->nullOnDelete();
            }
        });

        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'vat_amount')) {
                $table->decimal('vat_amount', 15, 2)->default(0)->after('discount');
            }
            if (!Schema::hasColumn('sales', 'vat_rate_id')) {
                $table->foreignId('vat_rate_id')->nullable()->after('vat_amount')->constrained('vat_rates')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'vat_rate_id')) {
                $table->dropConstrainedForeignId('vat_rate_id');
            }
            if (Schema::hasColumn('sales', 'vat_amount')) {
                $table->dropColumn('vat_amount');
            }
        });

        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'vat_rate_id')) {
                $table->dropConstrainedForeignId('vat_rate_id');
            }
        });

        Schema::dropIfExists('tax_settings');
        Schema::dropIfExists('vat_rates');
    }
};
