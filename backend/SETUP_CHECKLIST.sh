#!/bin/bash

# POS Backend Setup Checklist
# Follow these steps to set up the backend

echo "================================"
echo "POS Backend Setup Checklist"
echo "================================"
echo ""

# Step 1: Navigate to backend
echo "✓ Step 1: Navigate to backend directory"
echo "  cd backend"
echo ""

# Step 2: Create MySQL database
echo "✓ Step 2: Create MySQL database"
echo "  Run in MySQL:"
echo "  CREATE DATABASE pos_system;"
echo ""

# Step 3: Copy environment file
echo "✓ Step 3: Copy environment file"
echo "  Command: cp .env.example .env"
echo ""

# Step 4: Update .env
echo "✓ Step 4: Update .env file"
echo "  Edit .env and set:"
echo "  DB_CONNECTION=mysql"
echo "  DB_HOST=127.0.0.1"
echo "  DB_PORT=3306"
echo "  DB_DATABASE=pos_system"
echo "  DB_USERNAME=root"
echo "  DB_PASSWORD=your_password"
echo ""

# Step 5: Install dependencies
echo "✓ Step 5: Install dependencies"
echo "  Command: composer install"
echo ""

# Step 6: Generate application key
echo "✓ Step 6: Generate application key"
echo "  Command: php artisan key:generate"
echo ""

# Step 7: Run migrations
echo "✓ Step 7: Run migrations"
echo "  Command: php artisan migrate"
echo ""

# Step 8: Start server
echo "✓ Step 8: Start development server"
echo "  Command: php artisan serve"
echo ""

echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "API URL: http://localhost:8000/api"
echo ""
echo "Next steps:"
echo "1. Register a user: POST /api/auth/register"
echo "2. Login: POST /api/auth/login"
echo "3. Use token for protected routes"
echo ""
echo "Documentation:"
echo "- API Reference: API_DOCUMENTATION.md"
echo "- Setup Guide: BACKEND_SETUP.md"
echo "- Quick Reference: QUICK_REFERENCE.md"
echo ""
