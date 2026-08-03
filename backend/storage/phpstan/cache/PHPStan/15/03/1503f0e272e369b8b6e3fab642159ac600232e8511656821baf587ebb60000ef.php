<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Offer.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Offer
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-b6f94ad1d2b2469d29662a4cbb468d72f5215c3e95080b01cbe856b7334897e6',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Offer',
        'filename' => 'F:/my work/POS/backend/app/Models/Offer.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Offer',
    'shortName' => 'Offer',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $name
 * @property string|null $description
 * @property string|null $image_path
 * @property bool $days_of_week_enabled
 * @property array<int, string> $days_of_week
 * @property bool $expiration_enabled
 * @property Carbon|null $expiration_date
 * @property string|null $discount_type
 * @property array<string, mixed> $discount_rules
 * @property bool $is_active
 * @property Carbon|null $created_at
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 24,
    'endLine' => 56,
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
        'declaringClassName' => 'App\\Models\\Offer',
        'implementingClassName' => 'App\\Models\\Offer',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'company_id\', \'name\', \'description\', \'image_path\', \'days_of_week_enabled\', \'days_of_week\', \'expiration_enabled\', \'expiration_date\', \'discount_type\', \'discount_rules\', \'is_active\']',
          'attributes' => 
          array (
            'startLine' => 26,
            'endLine' => 38,
            'startTokenPos' => 40,
            'startFilePos' => 714,
            'endTokenPos' => 75,
            'endFilePos' => 1000,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 26,
        'endLine' => 38,
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
        'startLine' => 40,
        'endLine' => 50,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Offer',
        'implementingClassName' => 'App\\Models\\Offer',
        'currentClassName' => 'App\\Models\\Offer',
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
        'startLine' => 52,
        'endLine' => 55,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Offer',
        'implementingClassName' => 'App\\Models\\Offer',
        'currentClassName' => 'App\\Models\\Offer',
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