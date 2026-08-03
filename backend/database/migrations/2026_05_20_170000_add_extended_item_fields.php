<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function columns(): array
    {
        return [
            'auto_generate_item_number' => fn (Blueprint $table) => $table->boolean('auto_generate_item_number')->default(true)->after('item_number'),
            'wholesale_price' => fn (Blueprint $table) => $table->decimal('wholesale_price', 15, 2)->default(0)->after('selling_price'),
            'purchase_price' => fn (Blueprint $table) => $table->decimal('purchase_price', 15, 2)->default(0)->after('wholesale_price'),
            'default_discount' => fn (Blueprint $table) => $table->decimal('default_discount', 15, 2)->default(0)->after('purchase_price'),
            'default_discount_type' => fn (Blueprint $table) => $table->string('default_discount_type', 10)->default('percent')->after('default_discount'),
            'max_discount' => fn (Blueprint $table) => $table->decimal('max_discount', 15, 2)->default(0)->after('default_discount_type'),
            'has_multiple_options' => fn (Blueprint $table) => $table->boolean('has_multiple_options')->default(false)->after('max_discount'),
            'item_details' => fn (Blueprint $table) => $table->text('item_details')->nullable()->after('has_multiple_options'),
            'track_with_inventory' => fn (Blueprint $table) => $table->boolean('track_with_inventory')->default(true)->after('item_details'),
            'qty' => fn (Blueprint $table) => $table->decimal('qty', 15, 2)->default(0)->after('track_with_inventory'),
            'reorder_qty' => fn (Blueprint $table) => $table->decimal('reorder_qty', 15, 2)->default(0)->after('qty'),
            'uom' => fn (Blueprint $table) => $table->string('uom', 20)->default('pcs')->after('reorder_qty'),
            'expiry_date' => fn (Blueprint $table) => $table->date('expiry_date')->nullable()->after('uom'),
            'item_code' => fn (Blueprint $table) => $table->string('item_code')->nullable()->after('expiry_date'),
            'supplier_item_code' => fn (Blueprint $table) => $table->string('supplier_item_code')->nullable()->after('item_code'),
            'sku' => fn (Blueprint $table) => $table->string('sku')->nullable()->after('supplier_item_code'),
            'is_favourite' => fn (Blueprint $table) => $table->boolean('is_favourite')->default(false)->after('sku'),
            'item_category_id' => fn (Blueprint $table) => $table->unsignedBigInteger('item_category_id')->nullable()->after('is_favourite'),
            'item_sub_category_id' => fn (Blueprint $table) => $table->unsignedBigInteger('item_sub_category_id')->nullable()->after('item_category_id'),
        ];
    }

    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            foreach ($this->columns() as $name => $callback) {
                if (!Schema::hasColumn('items', $name)) {
                    $callback($table);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $cols = array_keys($this->columns());
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('items', $c));
            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });
    }
};
