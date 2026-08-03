<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Subscription.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Subscription
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-aef7cf7c2e6b37ac674d6b52e2e87a7fe8917f0131f29aef5ef36a573719fdbd',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Subscription',
        'filename' => 'F:/my work/POS/backend/app/Models/Subscription.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Subscription',
    'shortName' => 'Subscription',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $company_id
 * @property int|null $cloud_id
 * @property string|null $product_name
 * @property int|null $license_count
 * @property Carbon $period_start
 * @property Carbon $period_end
 * @property string|null $monthly_charge
 * @property Carbon $next_payment_date
 * @property string|null $status
 * @property-read \\Illuminate\\Database\\Eloquent\\Collection<int, SubscriptionPayment> $payments
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 23,
    'endLine' => 58,
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
        'declaringClassName' => 'App\\Models\\Subscription',
        'implementingClassName' => 'App\\Models\\Subscription',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'company_id\', \'cloud_id\', \'product_name\', \'license_count\', \'period_start\', \'period_end\', \'monthly_charge\', \'next_payment_date\', \'status\']',
          'attributes' => 
          array (
            'startLine' => 25,
            'endLine' => 35,
            'startTokenPos' => 45,
            'startFilePos' => 726,
            'endTokenPos' => 74,
            'endFilePos' => 952,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 25,
        'endLine' => 35,
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
      'casts' => 
      array (
        'name' => 'casts',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'array',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 37,
        'endLine' => 47,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Subscription',
        'implementingClassName' => 'App\\Models\\Subscription',
        'currentClassName' => 'App\\Models\\Subscription',
        'aliasName' => NULL,
      ),
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
        'startLine' => 49,
        'endLine' => 52,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Subscription',
        'implementingClassName' => 'App\\Models\\Subscription',
        'currentClassName' => 'App\\Models\\Subscription',
        'aliasName' => NULL,
      ),
      'payments' => 
      array (
        'name' => 'payments',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'Illuminate\\Database\\Eloquent\\Relations\\HasMany',
            'isIdentifier' => false,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => NULL,
        'startLine' => 54,
        'endLine' => 57,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Subscription',
        'implementingClassName' => 'App\\Models\\Subscription',
        'currentClassName' => 'App\\Models\\Subscription',
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