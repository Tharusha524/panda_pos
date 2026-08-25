<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserSettingController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\CompanySettingController;
use App\Http\Controllers\Api\CompanyNotificationSettingController;
use App\Http\Controllers\Api\ItemSettingController;
use App\Http\Controllers\Api\InventorySettingController;
use App\Http\Controllers\Api\OrderSettingController;
use App\Http\Controllers\Api\HardwareSettingController;
use App\Http\Controllers\Api\EmployeeSettingController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\CustomerNotificationSettingController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BankController;
use App\Http\Controllers\Api\AlertSettingController;
use App\Http\Controllers\Api\TaxSettingController;
use App\Http\Controllers\Api\ApiSettingController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\PosDashboardController;
use App\Http\Controllers\Api\SystemAlertController;
use App\Http\Controllers\Api\MobileDeviceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RepairController;
use Illuminate\Support\Facades\Route;

// Public routes (rate-limited)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyPasswordResetOtp']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPasswordWithOtp']);
});

// Public branding (logo/name shown on the login, register, and configure screens
// — before the app knows which user/company is signing in).
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/branding', [CompanySettingController::class, 'publicBranding']);
});

// Protected routes (require authentication)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    // Auth routes (always available)
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/profile/image', [AuthController::class, 'uploadProfileImage']);
    Route::delete('/auth/profile/image', [AuthController::class, 'deleteProfileImage']);
    Route::post('/auth/profile/email/request-otp', [AuthController::class, 'requestEmailChangeOtp']);
    Route::post('/auth/profile/email/verify-otp', [AuthController::class, 'verifyEmailChangeOtp']);
    Route::post('/auth/profile/email/confirm', [AuthController::class, 'confirmEmailChange']);
    Route::get('/auth/login-history', [AuthController::class, 'loginHistory']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Subscription & online payment (available even when overdue)
    Route::get('/subscription/status', [SubscriptionController::class, 'status']);
    Route::get('/subscription', [SubscriptionController::class, 'show']);
    Route::post('/subscription/pay', [SubscriptionController::class, 'pay']);

    Route::middleware('subscription.active')->group(function () {
        // POS settings – user profile
        Route::get('/settings/user', [UserSettingController::class, 'show']);
        Route::put('/settings/user', [UserSettingController::class, 'update']);

        // POS settings – company & branches
        Route::get('/settings/company', [CompanySettingController::class, 'show']);
        Route::get('/settings/company/print-header', [CompanySettingController::class, 'printHeader']);
        Route::put('/settings/company', [CompanySettingController::class, 'update']);
        Route::post('/settings/company/logo', [CompanySettingController::class, 'uploadLogo']);
        Route::delete('/settings/company/logo', [CompanySettingController::class, 'deleteLogo']);
        Route::put('/settings/company/locale', [CompanySettingController::class, 'updateLocale']);

        Route::get('/settings/company/notifications', [CompanyNotificationSettingController::class, 'show']);
        Route::put('/settings/company/notifications', [CompanyNotificationSettingController::class, 'update']);
        Route::post('/settings/company/notifications/send-test', [CompanyNotificationSettingController::class, 'sendTest']);

        // POS settings – item
        Route::get('/settings/item', [ItemSettingController::class, 'show']);
        Route::put('/settings/item', [ItemSettingController::class, 'update']);

        // POS settings – inventory
        Route::get('/settings/inventory', [InventorySettingController::class, 'show']);
        Route::put('/settings/inventory', [InventorySettingController::class, 'update']);

        // POS settings – order
        Route::get('/settings/order', [OrderSettingController::class, 'show']);
        Route::put('/settings/order', [OrderSettingController::class, 'update']);

        // POS settings – hardware
        Route::get('/settings/hardware', [HardwareSettingController::class, 'show']);
        Route::put('/settings/hardware', [HardwareSettingController::class, 'update']);
        Route::post('/settings/hardware/open-cash-drawer', [HardwareSettingController::class, 'openCashDrawer']);
        Route::post('/settings/hardware/logo-80mm', [HardwareSettingController::class, 'uploadLogo80mm']);
        Route::delete('/settings/hardware/logo-80mm', [HardwareSettingController::class, 'deleteLogo80mm']);
        Route::post('/settings/hardware/logo-a4', [HardwareSettingController::class, 'uploadLogoA4']);
        Route::delete('/settings/hardware/logo-a4', [HardwareSettingController::class, 'deleteLogoA4']);

        // POS settings – employee
        Route::get('/settings/employee', [EmployeeSettingController::class, 'show']);
        Route::put('/settings/employee', [EmployeeSettingController::class, 'update']);
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

        // POS settings – email & SMS customer notifications
        Route::get('/settings/notifications', [CustomerNotificationSettingController::class, 'show']);
        Route::get('/settings/notifications/sales', [CustomerNotificationSettingController::class, 'showSales']);
        Route::put('/settings/notifications/sales', [CustomerNotificationSettingController::class, 'updateSales']);
        Route::get('/settings/notifications/payment', [CustomerNotificationSettingController::class, 'showPayment']);
        Route::put('/settings/notifications/payment', [CustomerNotificationSettingController::class, 'updatePayment']);

        Route::get('/branches', [BranchController::class, 'index']);
        Route::post('/branches', [BranchController::class, 'store']);
        Route::put('/branches/{id}', [BranchController::class, 'update']);
        Route::delete('/branches/{id}', [BranchController::class, 'destroy']);

        // Bank accounts
        Route::get('/banks', [BankController::class, 'index']);
        Route::post('/banks', [BankController::class, 'store']);
        Route::put('/banks/{id}', [BankController::class, 'update']);
        Route::delete('/banks/{id}', [BankController::class, 'destroy']);

        // POS settings – alert
        Route::get('/settings/alert', [AlertSettingController::class, 'show']);
        Route::put('/settings/alert', [AlertSettingController::class, 'update']);

        // POS settings – tax / VAT
        Route::get('/settings/tax', [TaxSettingController::class, 'show']);
        Route::put('/settings/tax', [TaxSettingController::class, 'update']);
        Route::post('/settings/tax/vat-rates', [TaxSettingController::class, 'storeVatRate']);
        Route::put('/settings/tax/vat-rates/{id}', [TaxSettingController::class, 'updateVatRate']);
        Route::delete('/settings/tax/vat-rates/{id}', [TaxSettingController::class, 'destroyVatRate']);
        Route::post('/settings/tax/assign-items', [TaxSettingController::class, 'assignVatToItems']);

        // POS settings – API / integrations (admin)
        Route::get('/settings/api', [ApiSettingController::class, 'show']);
        Route::put('/settings/api', [ApiSettingController::class, 'update']);
        Route::post('/settings/api/regenerate-key', [ApiSettingController::class, 'regenerateKey']);

        // Database backups (admin)
        Route::get('/settings/backups', [BackupController::class, 'index']);
        Route::post('/settings/backups', [BackupController::class, 'store']);
        Route::post('/settings/backups/upload', [BackupController::class, 'upload']);
        Route::get('/settings/backups/{filename}/download', [BackupController::class, 'download']);
        Route::post('/settings/backups/{filename}/restore', [BackupController::class, 'restore']);
        Route::delete('/settings/backups/{filename}', [BackupController::class, 'destroy']);

        // Mobile device profile (permissions, IPs)
        Route::post('/mobile/device-profile', [MobileDeviceController::class, 'store']);

        // POS dashboard (live metrics)
        Route::get('/pos/dashboard', [PosDashboardController::class, 'overview']);
        Route::get('/pos/dashboard/today-tables', [PosDashboardController::class, 'todayTables']);

        // In-app system alerts (expiry, low stock, etc.)
        Route::get('/notifications/alerts', [SystemAlertController::class, 'index']);
        Route::get('/notifications/alerts/template-preview', [SystemAlertController::class, 'templatePreview']);
        Route::post('/notifications/alerts/send-test', [SystemAlertController::class, 'sendTest']);

        // POS reports
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/{reportKey}', [ReportController::class, 'show']);

        // Offers
        Route::get('/offers', [OfferController::class, 'index']);
        Route::get('/offers/applicable/list', [OfferController::class, 'applicable']);
        Route::post('/offers/preview', [OfferController::class, 'preview']);
        Route::get('/offers/{id}', [OfferController::class, 'show']);
        Route::post('/offers', [OfferController::class, 'store']);
        Route::put('/offers/{id}', [OfferController::class, 'update']);
        Route::delete('/offers/{id}', [OfferController::class, 'destroy']);

        // Purchases
        Route::get('/purchases', [PurchaseController::class, 'index']);
        Route::get('/purchases/next-invoice-id', [PurchaseController::class, 'nextInvoiceId']);
        Route::get('/purchases/{id}', [PurchaseController::class, 'show']);
        Route::post('/purchases', [PurchaseController::class, 'store']);
        Route::put('/purchases/{id}', [PurchaseController::class, 'update']);
        Route::delete('/purchases/{id}', [PurchaseController::class, 'destroy']);

        // Payments
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::get('/payments/next-sales-no', [PaymentController::class, 'nextSalesNo']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::put('/payments/{id}', [PaymentController::class, 'update']);
        Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

        // Expenses
        Route::get('/expenses/categories', [ExpenseCategoryController::class, 'index']);
        Route::post('/expenses/categories', [ExpenseCategoryController::class, 'store']);
        Route::put('/expenses/categories/{id}', [ExpenseCategoryController::class, 'update']);
        Route::delete('/expenses/categories/{id}', [ExpenseCategoryController::class, 'destroy']);
        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::get('/expenses/next-reference-no', [ExpenseController::class, 'nextReferenceNo']);
        Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

        // Sales
        Route::get('/sales/pos-context', [SaleController::class, 'posContext']);
        Route::get('/sales/hold-orders', [SaleController::class, 'holdOrders']);
        Route::post('/sales/verify-refund-card', [SaleController::class, 'verifyRefundCard']);
        Route::get('/sales', [SaleController::class, 'index']);
        Route::get('/sales/next-sales-id', [SaleController::class, 'nextSalesId']);
        Route::get('/sales/{id}/receipt', [SaleController::class, 'receipt']);
        Route::get('/sales/{id}', [SaleController::class, 'show']);
        Route::post('/sales', [SaleController::class, 'store']);
        Route::post('/sales/{id}/complete-hold', [SaleController::class, 'completeHold']);
        Route::put('/sales/{id}', [SaleController::class, 'update']);
        Route::delete('/sales/{id}', [SaleController::class, 'destroy']);

        // Shipping
        Route::get('/shipments', [ShipmentController::class, 'index']);
        Route::get('/shipments/next-shipment-no', [ShipmentController::class, 'nextShipmentNo']);
        Route::get('/shipments/{id}', [ShipmentController::class, 'show']);
        Route::post('/shipments', [ShipmentController::class, 'store']);
        Route::put('/shipments/{id}', [ShipmentController::class, 'update']);
        Route::delete('/shipments/{id}', [ShipmentController::class, 'destroy']);

        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/types', [CustomerController::class, 'types']);
        Route::post('/customers/types', [CustomerController::class, 'storeType']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);
        Route::post('/customers/{id}/receive-payment', [CustomerController::class, 'receivePayment']);
        Route::get('/customers/{id}/outstanding-bills', [CustomerController::class, 'outstandingBills']);
        Route::get('/customers/{id}/payments', [CustomerController::class, 'payments']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

        // Repair
        Route::get('/repairs', [RepairController::class, 'index']);
        Route::get('/repairs/search', [RepairController::class, 'search']);
        Route::get('/repairs/context', [RepairController::class, 'context']);
        Route::post('/repairs/transfer', [RepairController::class, 'transfer']);

        // Items (inventory dashboard)
        Route::get('/items/pos-search', [ItemController::class, 'posSearch']);
        Route::get('/items', [ItemController::class, 'index']);
        Route::get('/items/next-number', [ItemController::class, 'nextNumber']);
        Route::get('/items/categories', [ItemController::class, 'categories']);
        Route::post('/items/categories', [ItemController::class, 'storeCategory']);
        Route::put('/items/categories/{id}', [ItemController::class, 'updateCategory']);
        Route::delete('/items/categories/{id}', [ItemController::class, 'destroyCategory']);
        Route::post('/items/subcategories', [ItemController::class, 'storeSubCategory']);
        Route::put('/items/subcategories/{id}', [ItemController::class, 'updateSubCategory']);
        Route::delete('/items/subcategories/{id}', [ItemController::class, 'destroySubCategory']);
        Route::patch('/items/{id}/purchase-price', [ItemController::class, 'updatePurchasePrice']);
        Route::post('/items/{id}/image', [ItemController::class, 'uploadImage']);
        Route::get('/items/{id}/history', [ItemController::class, 'history']);
        Route::get('/items/{id}/cost-view', [ItemController::class, 'costView']);
        Route::post('/items/{id}/adjust', [ItemController::class, 'adjust']);
        Route::post('/items/{id}/write-off', [ItemController::class, 'writeOff']);
        Route::get('/items/{id}/batches', [ItemController::class, 'batches']);
        Route::get('/items/{id}/inventory-breakdown', [ItemController::class, 'inventoryBreakdown']);
        Route::post('/items/{id}/batches', [ItemController::class, 'storeBatch']);
        Route::put('/items/{id}/batches/{batchId}', [ItemController::class, 'updateBatch']);
        Route::delete('/items/{id}/batches/{batchId}', [ItemController::class, 'destroyBatch']);
        Route::get('/items/{id}/additional-charges', [ItemController::class, 'additionalCharges']);
        Route::put('/items/{id}/additional-charges', [ItemController::class, 'saveAdditionalCharges']);
        Route::get('/items/{id}', [ItemController::class, 'show']);
        Route::post('/items', [ItemController::class, 'store']);
        Route::put('/items/{id}', [ItemController::class, 'update']);
        Route::delete('/items/{id}', [ItemController::class, 'destroy']);

        // Roles
        Route::apiResource('roles', RoleController::class);

        // User management routes
        Route::apiResource('users', UserController::class);
        Route::get('/users/search', [UserController::class, 'search']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);

        // Activity logging routes
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/activity-logs/recent', [ActivityLogController::class, 'recent']);
        Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
        Route::get('/activity-logs/user/{userId}', [ActivityLogController::class, 'userLogs']);
        Route::get('/activity-logs/model/{modelType}/{modelId}', [ActivityLogController::class, 'modelLogs']);
        Route::get('/activity-logs/action/{action}', [ActivityLogController::class, 'actionLogs']);
    });
});
