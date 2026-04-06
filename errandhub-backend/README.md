# ErrandHub Backend API

A production-ready Node.js/Express backend for the ErrandHub errand service platform.

## 🚀 Features

- **Authentication**: JWT-based auth with password hashing
- **Order Management**: Full CRUD operations for orders
- **Role-based Access**: User, Runner, and Admin roles
- **Real-time Chat**: Chat system between users and runners
- **Payment Processing**: Multiple payment methods support
- **File Uploads**: Receipt upload functionality
- **Notifications**: In-app notification system
- **Admin Dashboard**: Comprehensive admin controls

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize the database:
```bash
npm run db:init
```

4. Seed the database with test data:
```bash
npm run db:seed
```

5. Start the server:
```bash
npm start
# or for development
npm run dev
```

## 🔑 Test Accounts

After seeding, you can use these accounts:

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@errandhub.com    | admin123  |
| User  | user@errandhub.com     | user123   |
| Runner| runner@errandhub.com   | runner123 |

## 📚 API Documentation

### Authentication

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+2348012345678",
  "role": "user" // or "runner"
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### Orders

#### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "errandType": "grocery",
  "items": [
    { "name": "Rice", "quantity": 1, "estimatedPrice": 5000 }
  ],
  "deliveryAddress": "123 Main St",
  "deliveryCity": "Lagos",
  "deliveryState": "Lagos",
  "itemFee": 5000,
  "deliveryFee": 2000,
  "serviceFee": 1000,
  "totalAmount": 8000
}
```

#### GET /api/orders
Get all orders for the current user.

#### GET /api/orders/:id
Get a specific order by ID.

#### PUT /api/orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "on_the_way"
}
```

### Admin

#### GET /api/admin/dashboard-stats
Get dashboard statistics.

#### GET /api/admin/orders
Get all orders (admin only).

#### GET /api/admin/users
Get all users (admin only).

#### GET /api/admin/runners
Get all runners (admin only).

### Runner

#### GET /api/runner/available-tasks
Get available tasks for runners.

#### GET /api/runner/my-tasks
Get tasks assigned to the current runner.

#### POST /api/runner/tasks/:id/accept
Accept a task.

#### PUT /api/runner/tasks/:id/status
Update task status.

### Chat

#### GET /api/chat/:orderId
Get chat messages for an order.

#### POST /api/chat/:orderId
Send a message.

**Request Body:**
```json
{
  "message": "Hello, I'm on my way!"
}
```

### Payments

#### POST /api/payments
Create a payment.

**Request Body:**
```json
{
  "orderId": "uuid",
  "amount": 8000,
  "paymentMethod": "card" // or "wallet", "cash"
}
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `phone` (VARCHAR)
- `role` (ENUM: 'user', 'runner', 'admin')
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Orders Table
- `id` (UUID, Primary Key)
- `order_number` (VARCHAR, Unique)
- `user_id` (UUID, Foreign Key)
- `runner_id` (UUID, Foreign Key, Nullable)
- `errand_type` (VARCHAR)
- `status` (ENUM)
- `total_amount` (DECIMAL)
- `created_at` (TIMESTAMP)

### Runners Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `vehicle_type` (VARCHAR)
- `is_available` (BOOLEAN)
- `rating` (DECIMAL)
- `total_deliveries` (INTEGER)

## 🔒 Security

- Passwords are hashed using SHA-256
- JWT tokens for authentication
- Role-based access control
- Input validation with express-validator
- CORS enabled for cross-origin requests

## 📄 License

MIT
