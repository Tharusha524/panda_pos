<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemSubCategory;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->first();
        if (!$company) {
            return;
        }

        $categories = [
            'Soap' => ['Papaya'],
            'Milk powder' => ['Others'],
            'Vegetable' => ['Ret'],
            'Drinks' => ['Blue'],
            'Electronic' => [],
        ];

        foreach ($categories as $catName => $subs) {
            $cat = ItemCategory::firstOrCreate(
                ['company_id' => $company->id, 'name' => $catName]
            );
            foreach ($subs as $subName) {
                ItemSubCategory::firstOrCreate([
                    'company_id' => $company->id,
                    'item_category_id' => $cat->id,
                    'name' => $subName,
                ]);
            }
        }

        $items = [
            ['00SP1', 'PAPAYA SOAP', 'Soap', 'Papaya', 600.00],
            ['01010', 'Anchor', 'Milk powder', 'Others', 1000.00],
            ['10181', 'onions', 'Vegetable', 'Ret', 250.00],
            ['10182', '7up', 'Drinks', 'Blue', 150.00],
            ['10183', 'Laptop', 'Electronic', null, 27000.00],
        ];

        foreach ($items as [$number, $desc, $cat, $sub, $price]) {
            Item::firstOrCreate(
                ['company_id' => $company->id, 'item_number' => $number],
                [
                    'description' => $desc,
                    'category' => $cat,
                    'sub_category' => $sub,
                    'selling_price' => $price,
                    'location' => 'Main Location',
                    'is_active' => true,
                ]
            );
        }
    }
}
