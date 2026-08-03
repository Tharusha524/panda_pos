# POS Backend - API Documentation

## Overview
This is a Laravel-based backend API for the Point of Sale (POS) system with user authentication and management using MySQL database and Repository pattern.

## Installation & Setup

### Prerequisites
- PHP 8.2+
- MySQL 8.0+
- Composer

### Step 1: Install Dependencies
```bash
cd backend
composer install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_system
DB_USERNAME=root
DB_PASSWORD=your_password

APP_KEY=base64:your_app_key_here
```

### Step 3: Generate Application Key
```bash
php artisan key:generate
```

### Step 4: Run Migrations
```bash
php artisan migrate
```

### Step 5: Start the Development Server
```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api`

---

## Architecture

### Repository Pattern
- **Interface**: `app/Interfaces/UserRepositoryInterface.php`
- **Repository**: `app/Repositories/UserRepository.php`
- **Service**: `app/Services/UserService.php`
- **Controller**: `app/Http/Controllers/Api/`

### Database
- MySQL with users table containing: id, name, email, password, phone, city, role, status

---

## API Endpoints

### Authentication (Public)

#### 1. Register User
**POST** `/api/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "555-0001",
  "city": "New York"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0001",
    "city": "New York",
    "role": "user",
    "status": "active",
    "created_at": "2026-05-19T10:00:00Z"
  }
}
```

#### 2. Login User
**POST** `/api/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0001",
      "city": "New York",
      "role": "user",
      "status": "active"
    },
    "token": "your_bearer_token_here"
  }
}
```

---

### Authentication (Protected - Requires Bearer Token)

#### 3. Get User Profile
**GET** `/api/auth/profile`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0001",
    "city": "New York",
    "role": "user",
    "status": "active"
  }
}
```

#### 4. Change Password
**POST** `/api/auth/change-password`

Headers:
```
Authorization: Bearer your_token_here
```

Request:
```json
{
  "old_password": "password123",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 5. Logout
**POST** `/api/auth/logout`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### User Management (Protected - Requires Bearer Token)

#### 6. Get All Users
**GET** `/api/users?per_page=15&page=1`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-0001",
        "city": "New York",
        "role": "user",
        "status": "active",
        "created_at": "2026-05-19T10:00:00Z"
      }
    ],
    "current_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

#### 7. Get User by ID
**GET** `/api/users/{id}`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0001",
    "city": "New York",
    "role": "user",
    "status": "active"
  }
}
```

#### 8. Create User (Admin)
**POST** `/api/users`

Headers:
```
Authorization: Bearer your_token_here
```

Request:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "555-0002",
  "city": "Los Angeles",
  "role": "manager",
  "status": "active"
}
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-0002",
    "city": "Los Angeles",
    "role": "manager",
    "status": "active"
  }
}
```

#### 9. Update User
**PUT** `/api/users/{id}`

Headers:
```
Authorization: Bearer your_token_here
```

Request:
```json
{
  "name": "Jane Smith Updated",
  "phone": "555-0003",
  "city": "Chicago",
  "role": "admin",
  "status": "inactive"
}
```

Response:
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith Updated",
    "email": "jane@example.com",
    "phone": "555-0003",
    "city": "Chicago",
    "role": "admin",
    "status": "inactive"
  }
}
```

#### 10. Delete User
**DELETE** `/api/users/{id}`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### 11. Search Users
**GET** `/api/users/search?query=john&per_page=15`

Headers:
```
Authorization: Bearer your_token_here
```

Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-0001",
        "city": "New York",
        "role": "user",
        "status": "active"
      }
    ],
    "current_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

#### 12. Reset User Password (Admin)
**POST** `/api/users/{id}/reset-password`

Headers:
```
Authorization: Bearer your_token_here
```

Request:
```json
{
  "new_password": "resetpassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

---

## User Roles

- **admin**: Full access to all features
- **manager**: Can manage users and view reports
- **user**: Limited access to own profile

---

## User Status

- **active**: User can login and use the system
- **inactive**: User cannot login

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

---

## Testing with Postman

1. Import the API endpoints into Postman
2. Register a new user at `/api/auth/register`
3. Login at `/api/auth/login` to get a token
4. Use the token in the `Authorization: Bearer <token>` header for protected routes
5. Test user management endpoints

---

## Development Notes

- All passwords are hashed using Laravel's built-in hashing
- Bearer tokens are managed by Sanctum
- Pagination defaults to 15 items per page
- Search is performed on name, email, and phone fields
