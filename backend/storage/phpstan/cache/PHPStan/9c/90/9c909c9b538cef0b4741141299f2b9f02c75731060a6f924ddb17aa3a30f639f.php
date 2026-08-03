<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Purchase.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Purchase
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-6782a7de11196406a7b2012e97f386008e3acaab7323dd7aaefe168f35481cee',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Purchase',
        'filename' => 'F:/my work/POS/backend/app/Models/Purchase.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Purchase',
    'shortName' => 'Purchase',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $purchase_type
 * @property string|null $location
 * @property Carbon $purchase_date
 * @property string|null $invoice_id
 * @property int|null $supplier_id
 * @property string|null $supplier_name
 * @property string|null $sub_total
 * @property string|null $discount
 * @property string|null $amount
 * @property string|null $net_terms
 * @property string|null $notes
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 24,
    'endLine' => 57,
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
        'declaringClassName' => 'App\\Models\\Purchase',
        'implementingClassName' => 'App\\Models\\Purchase',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'company_id\', \'purchase_type\', \'location\', \'purchase_date\', \'invoice_id\', \'supplier_id\', \'supplier_name\', \'sub_total\', \'discount\', \'amount\', \'net_terms\', \'notes\']',
          'attributes' => 
          array (
            'startLine' => 26,
            'endLine' => 39,
            'startTokenPos' => 40,
            'startFilePos' => 683,
            'endTokenPos' => 78,
            'endFilePos' => 961,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 26,
        'endLine' => 39,
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
        'declaringClassName' => 'App\\Models\\Purchase',
        'implementingClassName' => 'App\\Models\\Purchase',
        'name' => 'casts',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'purchase_date\' => \'date\', \'sub_total\' => \'decimal:2\', \'discount\' => \'decimal:2\', \'amount\' => \'decimal:2\']',
          'attributes' => 
          array (
            'startLine' => 41,
            'endLine' => 46,
            'startTokenPos' => 87,
            'startFilePos' => 990,
            'endTokenPos' => 117,
            'endFilePos' => 1140,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 41,
        'endLine' => 46,
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
        'startLine' => 48,
        'endLine' => 51,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Purchase',
        'implementingClassName' => 'App\\Models\\Purchase',
        'currentClassName' => 'App\\Models\\Purchase',
        'aliasName' => NULL,
      ),
      'supplier' => 
      array (
        'name' => 'supplier',
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
        'startLine' => 53,
        'endLine' => 56,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Purchase',
        'implementingClassName' => 'App\\Models\\Purchase',
        'currentClassName' => 'App\\Models\\Purchase',
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