# Activity Logging System - Guide

## ✅ What's New

A complete audit/activity logging system has been added to track all user actions:
- ✅ User registration
- ✅ User login/logout
- ✅ User creation (by admin)
- ✅ User updates
- ✅ User deletion
- ✅ Password changes
- ✅ Password resets
- ✅ Generic action logging

---

## 📁 Files Created

### Models
- `app/Models/ActivityLog.php` - Activity log model with helper methods

### Services
- `app/Services/ActivityLogService.php` - Easy-to-use logging service

### Repositories
- `app/Interfaces/ActivityLogRepositoryInterface.php` - Interface contract
- `app/Repositories/ActivityLogRepository.php` - Data access layer

### Controllers
- `app/Http/Controllers/Api/ActivityLogController.php` - API endpoints

### Database
- `database/migrations/2026_05_19_000003_create_activity_logs_table.php` - Table schema

### Seeder
- `database/seeders/UserSeeder.php` - Sample users with different roles

---

## 🚀 Setup & Installation

### Step 1: Run Migrations
```bash
php artisan migrate
```

This creates:
- `activity_logs` table
- `personal_access_tokens` table (if not exists)
- Other necessary tables

### Step 2: Run Seeder (Optional)
```bash
php artisan db:seed --class=UserSeeder
```

This creates 4 sample users + 5 random users:
- **Admin**: admin@pos.com / admin123
- **Manager**: manager@pos.com / manager123
- **User**: user@pos.com / user123
- **Inactive User**: inactive@pos.com / password123

---

## 🔌 API Endpoints

### Activity Log Endpoints (Protected)

All endpoints require Bearer token authentication.

#### Get All Activity Logs (Paginated)
```
GET /api/activity-logs?per_page=15
```

Response:
```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "user_id": 1,
        "action": "login",
        "model_type": null,
        "model_id": null,
        "description": "User logged in",
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0...",
        "changes": null,
        "created_at": "2026-05-19T10:30:00Z",
        "updated_at": "2026-05-19T10:30:00Z"
      }
    ],
    "links": {...},
    "meta": {...}
  }
}
```

#### Get Recent Activity Logs
```
GET /api/activity-logs/recent?limit=50
```

Returns up to 50 most recent activities.

#### Get Activity Log by ID
```
GET /api/activity-logs/{id}
```

#### Get Activity Logs for User
```
GET /api/activity-logs/user/{userId}?limit=50
```

Example:
```
GET /api/activity-logs/user/1?limit=50
```

#### Get Activity Logs for Model
```
GET /api/activity-logs/model/{modelType}/{modelId}?limit=50
```

Example:
```
GET /api/activity-logs/model/User/5?limit=50
```

#### Get Activity Logs by Action
```
GET /api/activity-logs/action/{action}?limit=50
```

Examples:
```
GET /api/activity-logs/action/login
GET /api/activity-logs/action/create
GET /api/activity-logs/action/update
GET /api/activity-logs/action/delete
GET /api/activity-logs/action/change_password
```

---

## 📊 Activity Log Schema

```sql
id                  BIGINT PRIMARY KEY
user_id             BIGINT (nullable) - User who performed action
action              VARCHAR - Action type (login, logout, create, update, etc)
model_type          VARCHAR (nullable) - Model affected (User, Product, etc)
model_id            BIGINT (nullable) - ID of affected model
description         TEXT (nullable) - Human-readable description
ip_address          VARCHAR (nullable) - IP address of request
user_agent          VARCHAR (nullable) - User agent string
changes             JSON (nullable) - Old vs new data
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

---

## 💻 Testing the API

### 1. Register and Get Token
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Response includes user data. This logs a "register" activity.

### 2. Login (Get Bearer Token)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "1|abc123xyz..."
  }
}
```

This logs a "login" activity.

### 3. View Activity Logs
```bash
curl -X GET http://localhost:8000/api/activity-logs \
  -H "Authorization: Bearer 1|abc123xyz..."
```

### 4. View Recent Activities
```bash
curl -X GET http://localhost:8000/api/activity-logs/recent?limit=10 \
  -H "Authorization: Bearer TOKEN"
```

### 5. View Your Activities
```bash
curl -X GET http://localhost:8000/api/activity-logs/user/1 \
  -H "Authorization: Bearer TOKEN"
```

### 6. Create User (Admin)
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "new@test.com",
    "password": "password123",
    "role": "user"
  }'
```

This logs a "create" activity.

### 7. Update User
```bash
curl -X PUT http://localhost:8000/api/users/2 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "city": "New City"
  }'
```

This logs an "update" activity with changes.

### 8. Change Password
```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "password123",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
  }'
```

This logs a "change_password" activity.

### 9. Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

This logs a "logout" activity.

---

## 🛠️ Using ActivityLogService in Your Code

### Basic Usage

```php
use App\Services\ActivityLogService;

class YourController extends Controller
{
    private ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function someAction()
    {
        // Log specific actions
        $this->activityLogService->logLogin(auth()->id());
        $this->activityLogService->logLogout(auth()->id());
        $this->activityLogService->logRegistration($userId, $data);
        $this->activityLogService->logUserCreation($userId, $userData);
        $this->activityLogService->logUserUpdate($userId, $oldData, $newData);
        $this->activityLogService->logUserDeletion($userId, $userName);
        $this->activityLogService->logPasswordChange($userId);
        $this->activityLogService->logPasswordReset($userId, $adminId);

        // Or log generic action
        $this->activityLogService->log(
            action: 'purchase',
            userId: auth()->id(),
            modelType: 'Order',
            modelId: $orderId,
            description: 'Customer purchased item',
            changes: ['items' => 5, 'total' => 100.00]
        );
    }
}
```

---

## 📊 Using ActivityLog Model Directly

```php
use App\Models\ActivityLog;

// Log activity
ActivityLog::log(
    action: 'export',
    modelType: 'Report',
    modelId: 1,
    description: 'Exported sales report'
);

// Get recent activities
$recent = ActivityLog::recent(limit: 20);

// Get activities for user
$userLogs = ActivityLog::forUser(userId: 5, limit: 50);

// Get activities for model
$modelLogs = ActivityLog::forModel(modelType: 'Product', modelId: 3, limit: 50);
```

---

## 🔍 Using ActivityLogRepository

```php
use App\Interfaces\ActivityLogRepositoryInterface;

class SomeService
{
    public function __construct(private ActivityLogRepositoryInterface $activityLogRepository)
    {
    }

    public function getAnalytics()
    {
        // Get all logs
        $all = $this->activityLogRepository->getAll(perPage: 20);

        // Get recent
        $recent = $this->activityLogRepository->getRecent(limit: 50);

        // Get for user
        $userLogs = $this->activityLogRepository->getForUser(userId: 1, limit: 50);

        // Get by action
        $logins = $this->activityLogRepository->getByAction(action: 'login', limit: 100);

        // Delete old logs (older than 90 days)
        $deleted = $this->activityLogRepository->deleteOldLogs(days: 90);
    }
}
```

---

## 📈 Sample Use Cases

### Track Sales
```php
$this->activityLogService->log(
    action: 'sale_completed',
    modelType: 'Sale',
    modelId: $saleId,
    description: 'Sale completed - Amount: ' . $amount,
    changes: ['status' => 'completed', 'amount' => $amount]
);
```

### Track Inventory Changes
```php
$this->activityLogService->log(
    action: 'inventory_adjusted',
    modelType: 'Inventory',
    modelId: $itemId,
    description: 'Inventory adjusted',
    changes: ['quantity' => ['old' => 100, 'new' => 95]]
);
```

### Track Reports
```php
$this->activityLogService->log(
    action: 'report_generated',
    modelType: 'Report',
    modelId: $reportId,
    description: 'Sales report generated'
);
```

---

## ⏰ Maintenance

### Cleanup Old Logs

To delete logs older than 90 days:
```bash
php artisan tinker

>>> app(App\Repositories\ActivityLogRepository::class)->deleteOldLogs(days: 90);
```

Or create an artisan command:
```php
// app/Console/Commands/CleanupActivityLogs.php
php artisan make:command CleanupActivityLogs
```

---

## 📊 Sample Data

After seeding, you'll have:

### Users
1. Admin (admin@pos.com)
2. Manager (manager@pos.com)
3. User (user@pos.com)
4. Inactive (inactive@pos.com)
5-9. 5 Random users

### Activities Logged During Seeding
- Registration (4 main users)
- Fake user creation activities

---

## 🔐 Security Notes

✅ **IP Address Tracking**: All activities log the request IP
✅ **User Agent**: Tracks browser/client information
✅ **Soft Delete Tracking**: Can track what was deleted
✅ **Change Tracking**: Records old vs new values
✅ **User Attribution**: Links to authenticated user
✅ **Immutable**: Once logged, activities cannot be edited (by design)

---

## 📝 What Gets Logged Automatically

| Action | Logged | Details |
|--------|--------|---------|
| Register | ✅ | User registration |
| Login | ✅ | User login |
| Logout | ✅ | User logout |
| Change Password | ✅ | Password change |
| Create User | ✅ | Admin creates user |
| Update User | ✅ | Changes tracked |
| Delete User | ✅ | User deletion |
| Reset Password | ✅ | Admin password reset |

---

## 🎯 Next Steps

1. ✅ Run migrations: `php artisan migrate`
2. ✅ Seed users: `php artisan db:seed --class=UserSeeder`
3. ✅ Test API endpoints with cURL examples above
4. ✅ Integrate with frontend to display activity logs
5. ✅ Create dashboard to visualize activities

---

## 🆘 Troubleshooting

### Migration Fails
```bash
php artisan migrate:rollback
php artisan migrate
```

### Logs Not Appearing
1. Check if middleware is applied to routes
2. Verify auth token is valid
3. Check if ActivityLogService is injected
4. View database directly: `SELECT * FROM activity_logs;`

### Can't Find Logs for User
```bash
# View in database
SELECT * FROM activity_logs WHERE user_id = 1 ORDER BY created_at DESC;

# Or via API
GET /api/activity-logs/user/1
```

---

## 📞 Reference

- **Model**: `app/Models/ActivityLog.php`
- **Service**: `app/Services/ActivityLogService.php`
- **Repository**: `app/Repositories/ActivityLogRepository.php`
- **Controller**: `app/Http/Controllers/Api/ActivityLogController.php`
- **Migration**: `database/migrations/2026_05_19_000003_create_activity_logs_table.php`

---

**Status**: ✅ Ready to Use

All logging infrastructure is in place and integrated with authentication and user management systems.
