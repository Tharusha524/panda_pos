<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\SubscriptionPayment.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\SubscriptionPayment
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-2e693949a470d2b4eda79283618319d7410d61f022a4c7aa29e94ab5a2f5e7b6',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\SubscriptionPayment',
        'filename' => 'F:/my work/POS/backend/app/Models/SubscriptionPayment.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\SubscriptionPayment',
    'shortName' => 'SubscriptionPayment',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $subscription_id
 * @property Carbon $paid_at
 * @property string|null $card_type
 * @property string|null $card_last_four
 * @property string|null $amount
 * @property string|null $payment_method
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 18,
    'endLine' => 41,
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
        'declaringClassName' => 'App\\Models\\SubscriptionPayment',
        'implementingClassName' => 'App\\Models\\SubscriptionPayment',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'subscription_id\', \'paid_at\', \'card_type\', \'card_last_four\', \'amount\', \'payment_method\']',
          'attributes' => 
          array (
            'startLine' => 20,
            'endLine' => 27,
            'startTokenPos' => 40,
            'startFilePos' => 479,
            'endTokenPos' => 60,
            'endFilePos' => 629,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 20,
        'endLine' => 27,
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
        'startLine' => 29,
        'endLine' => 35,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\SubscriptionPayment',
        'implementingClassName' => 'App\\Models\\SubscriptionPayment',
        'currentClassName' => 'App\\Models\\SubscriptionPayment',
        'aliasName' => NULL,
      ),
      'subscription' => 
      array (
        'name' => 'subscription',
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
        'startLine' => 37,
        'endLine' => 40,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\SubscriptionPayment',
        'implementingClassName' => 'App\\Models\\SubscriptionPayment',
        'currentClassName' => 'App\\Models\\SubscriptionPayment',
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