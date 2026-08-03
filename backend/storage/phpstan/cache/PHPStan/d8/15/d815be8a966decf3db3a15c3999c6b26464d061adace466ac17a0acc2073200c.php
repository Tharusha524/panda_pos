<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Item.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Item
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-e87b75484ae2e1da80528c758bd470545e65a79666d64c49135717f685b13b99',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Item',
        'filename' => 'F:/my work/POS/backend/app/Models/Item.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Item',
    'shortName' => 'Item',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $item_number
 * @property bool $auto_generate_item_number
 * @property string|null $description
 * @property string|null $image_path
 * @property string|null $category
 * @property string|null $sub_category
 * @property int|null $item_category_id
 * @property int|null $item_sub_category_id
 * @property string|null $product_type
 * @property string|null $location
 * @property float|int|string|null $selling_price
 * @property float|int|string|null $wholesale_price
 * @property float|int|string|null $purchase_price
 * @property float|int|string|null $default_discount
 * @property string|null $default_discount_type
 * @property float|int|string|null $max_discount
 * @property bool $has_multiple_options
 * @property string|null $item_details
 * @property bool $track_with_inventory
 * @property float|int|string|null $qty
 * @property float|int|string|null $reorder_qty
 * @property string|null $uom
 * @property Carbon|null $expiry_date
 * @property string|null $item_code
 * @property string|null $supplier_item_code
 * @property string|null $sku
 * @property bool $is_favourite
 * @property bool $is_active
 * @property-read Company|null $company
 * @property-read ItemCategory|null $itemCategory
 * @property-read ItemSubCategory|null $itemSubCategory
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 44,
    'endLine' => 108,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => 'Illuminate\\Database\\Eloquent\\Model',
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
    ),
    'immediateConstants' => 
    array (
    ),
    'immediateProperties' => 
    array (
      'fillable' => 
      array (
        'declaringClassName' => 'App\\Models\\Item',
        'implementingClassName' => 'App\\Models\\Item',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'company_id\', \'item_number\', \'auto_generate_item_number\', \'description\', \'image_path\', \'category\', \'sub_category\', \'item_category_id\', \'item_sub_category_id\', \'product_type\', \'location\', \'selling_price\', \'wholesale_price\', \'purchase_price\', \'default_discount\', \'default_discount_type\', \'max_discount\', \'has_multiple_options\', \'item_details\', \'track_with_inventory\', \'qty\', \'reorder_qty\', \'uom\', \'expiry_date\', \'item_code\', \'supplier_item_code\', \'sku\', \'is_favourite\', \'is_active\']',
          'attributes' => 
          array (
            'startLine' => 46,
            'endLine' => 76,
            'startTokenPos' => 40,
            'startFilePos' => 1591,
            'endTokenPos' => 129,
            'endFilePos' => 2340,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 46,
        'endLine' => 76,
        'startColumn' => 5,
        'endColumn' => 6,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
      'casts' => 
      array (
        'declaringClassName' => 'App\\Models\\Item',
        'implementingClassName' => 'App\\Models\\Item',
        'name' => 'casts',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'auto_generate_item_number\' => \'boolean\', \'selling_price\' => \'decimal:2\', \'wholesale_price\' => \'decimal:2\', \'purchase_price\' => \'decimal:2\', \'default_discount\' => \'decimal:2\', \'max_discount\' => \'decimal:2\', \'has_multiple_options\' => \'boolean\', \'track_with_inventory\' => \'boolean\', \'qty\' => \'decimal:2\', \'reorder_qty\' => \'decimal:2\', \'expiry_date\' => \'date\', \'is_favourite\' => \'boolean\', \'is_active\' => \'boolean\']',
          'attributes' => 
          array (
            'startLine' => 78,
            'endLine' => 92,
            'startTokenPos' => 138,
            'startFilePos' => 2369,
            'endTokenPos' => 231,
            'endFilePos' => 2906,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 78,
        'endLine' => 92,
        'startColumn' => 5,
        'endColumn' => 6,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
    ),
    'immediateMethods' => 
    array (
      'company' => 
      array (
        'name' => 'company',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 94,
        'endLine' => 97,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Item',
        'implementingClassName' => 'App\\Models\\Item',
        'currentClassName' => 'App\\Models\\Item',
        'aliasName' => NULL,
      ),
      'itemCategory' => 
      array (
        'name' => 'itemCategory',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 99,
        'endLine' => 102,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Item',
        'implementingClassName' => 'App\\Models\\Item',
        'currentClassName' => 'App\\Models\\Item',
        'aliasName' => NULL,
      ),
      'itemSubCategory' => 
      array (
        'name' => 'itemSubCategory',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 104,
        'endLine' => 107,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Item',
        'implementingClassName' => 'App\\Models\\Item',
        'currentClassName' => 'App\\Models\\Item',
        'aliasName' => NULL,
      ),
    ),
    'traitsData' => 
    array (
      'aliases' => 
      array (
      ),
      'modifiers' => 
      array (
      ),
      'precedences' => 
      array (
      ),
      'hashes' => 
      array (
      ),
    ),
  ),
));