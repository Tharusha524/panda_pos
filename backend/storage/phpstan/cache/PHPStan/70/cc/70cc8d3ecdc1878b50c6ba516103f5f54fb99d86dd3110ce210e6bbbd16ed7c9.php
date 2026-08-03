<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Role.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Role
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-b1c95ceacc695f690106ca063bd70f0744107582a18578e9837823a17cb2d8ba',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Role',
        'filename' => 'F:/my work/POS/backend/app/Models/Role.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Role',
    'shortName' => 'Role',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property string|null $name
 * @property string|null $slug
 * @property string|null $description
 * @property array<int, mixed> $permissions
 * @property bool $is_active
 * @property-read \\Illuminate\\Database\\Eloquent\\Collection<int, User> $users
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 17,
    'endLine' => 36,
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
        'declaringClassName' => 'App\\Models\\Role',
        'implementingClassName' => 'App\\Models\\Role',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'name\', \'slug\', \'description\', \'permissions\', \'is_active\']',
          'attributes' => 
          array (
            'startLine' => 19,
            'endLine' => 25,
            'startTokenPos' => 35,
            'startFilePos' => 473,
            'endTokenPos' => 52,
            'endFilePos' => 584,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 19,
        'endLine' => 25,
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
        'declaringClassName' => 'App\\Models\\Role',
        'implementingClassName' => 'App\\Models\\Role',
        'name' => 'casts',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'permissions\' => \'array\', \'is_active\' => \'boolean\']',
          'attributes' => 
          array (
            'startLine' => 27,
            'endLine' => 30,
            'startTokenPos' => 61,
            'startFilePos' => 613,
            'endTokenPos' => 77,
            'endFilePos' => 690,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 27,
        'endLine' => 30,
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
      'users' => 
      array (
        'name' => 'users',
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
        'startLine' => 32,
        'endLine' => 35,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'App\\Models',
        'declaringClassName' => 'App\\Models\\Role',
        'implementingClassName' => 'App\\Models\\Role',
        'currentClassName' => 'App\\Models\\Role',
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