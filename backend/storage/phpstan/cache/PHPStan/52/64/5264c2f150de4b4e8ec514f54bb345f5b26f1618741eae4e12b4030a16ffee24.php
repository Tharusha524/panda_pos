<?php declare(strict_types = 1);

// odsl-F:\my work\POS\backend\app\Models\Customer.php-PHPStan\BetterReflection\Reflection\ReflectionClass-App\Models\Customer
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-6.70.0.1-8.2.12-fbfa19539683718a153b2624ff6c0ebf4bdbafb587a61a0216164916969536b1',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'App\\Models\\Customer',
        'filename' => 'F:/my work/POS/backend/app/Models/Customer.php',
      ),
    ),
    'namespace' => 'App\\Models',
    'name' => 'App\\Models\\Customer',
    'shortName' => 'Customer',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $customer_code
 * @property string|null $customer_name
 * @property string|null $first_name
 * @property string|null $business_name
 * @property string|null $contact_no
 * @property bool $allow_duplicate_phone
 * @property string|null $email
 * @property Carbon|null $date_of_birth
 * @property string|null $passport_no
 * @property string|null $nic
 * @property string|null $address_line1
 * @property string|null $city
 * @property string|null $postal_code
 * @property string|null $country
 * @property string|null $province
 * @property string|null $source
 * @property int|null $sales_person_id
 * @property string|null $lead_sales_person
 * @property string|null $other_sales_person
 * @property string|null $support_person
 * @property string|null $customer_status
 * @property string|null $product
 * @property float|int|string|null $credit_limit
 * @property float|int|string|null $opening_balance
 * @property float|int|string|null $net_balance
 * @property string|null $notes
 * @property string|null $language
 * @property string|null $inventory_location
 * @property string|null $location
 * @property int|null $customer_type_id
 * @property float|int|string|null $customer_discount
 * @property-read Company|null $company
 * @property-read CustomerType|null $customerType
 * @property-read \\Illuminate\\Database\\Eloquent\\Collection<int, CustomerAdvancePayment> $advancePayments
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 48,
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
        'declaringClassName' => 'App\\Models\\Customer',
        'implementingClassName' => 'App\\Models\\Customer',
        'name' => 'fillable',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'company_id\', \'customer_code\', \'customer_name\', \'first_name\', \'business_name\', \'contact_no\', \'allow_duplicate_phone\', \'email\', \'date_of_birth\', \'passport_no\', \'nic\', \'address_line1\', \'city\', \'postal_code\', \'country\', \'province\', \'source\', \'sales_person_id\', \'lead_sales_person\', \'other_sales_person\', \'support_person\', \'customer_status\', \'product\', \'credit_limit\', \'opening_balance\', \'net_balance\', \'notes\', \'language\', \'inventory_location\', \'location\', \'customer_type_id\', \'customer_discount\']',
          'attributes' => 
          array (
            'startLine' => 50,
            'endLine' => 83,
            'startTokenPos' => 45,
            'startFilePos' => 1781,
            'endTokenPos' => 143,
            'endFilePos' => 2571,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 50,
        'endLine' => 83,
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
        'declaringClassName' => 'App\\Models\\Customer',
        'implementingClassName' => 'App\\Models\\Customer',
        'name' => 'casts',
        'modifiers' => 2,
        'type' => NULL,
        'default' => 
        array (
          'code' => '[\'allow_duplicate_phone\' => \'boolean\', \'credit_limit\' => \'decimal:2\', \'opening_balance\' => \'decimal:2\', \'net_balance\' => \'decimal:2\', \'customer_discount\' => \'decimal:2\', \'date_of_birth\' => \'date\']',
          'attributes' => 
          array (
            'startLine' => 85,
            'endLine' => 92,
            'startTokenPos' => 152,
            'startFilePos' => 2600,
            'endTokenPos' => 196,
            'endFilePos' => 2857,
          ),
        ),
        'docComment' => NULL,
        'attributes' => 
        array (
        ),
        'startLine' => 85,
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
        'declaringClassName' => 'App\\Models\\Customer',
        'implementingClassName' => 'App\\Models\\Customer',
        'currentClassName' => 'App\\Models\\Customer',
        'aliasName' => NULL,
      ),
      'customerType' => 
      array (
        'name' => 'customerType',
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
        'declaringClassName' => 'App\\Models\\Customer',
        'implementingClassName' => 'App\\Models\\Customer',
        'currentClassName' => 'App\\Models\\Customer',
        'aliasName' => NULL,
      ),
      'advancePayments' => 
      array (
        'name' => 'advancePayments',
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
        'declaringClassName' => 'App\\Models\\Customer',
        'implementingClassName' => 'App\\Models\\Customer',
        'currentClassName' => 'App\\Models\\Customer',
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