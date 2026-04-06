# ErrandHub - Full-Stack Errand Service Platform

A complete, production-ready errand service platform with a modern React frontend and Node.js/Express backend.

## 🏗️ Architecture

```
ErrandHub/
├── app/                    # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # Page Components
│   │   ├── services/       # API Services
│   │   ├── sections/       # Landing Page Sections
│   │   └── types/          # TypeScript Types
│   └── dist/               # Build Output
│
└── errandhub-backend/      # Node.js Backend
    ├── controllers/        # Route Controllers
    ├── database/           # Database Schema & Seeds
    ├── middleware/         # Auth & Validation
    ├── routes/             # API Routes
    └── uploads/            # File Uploads
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Start the Backend

```bash
cd errandhub-backend

# Install dependencies
npm install

# Set up PostgreSQL database
# Update .env with your database credentials

# Initialize database
npm run db:init

# Seed with test data
npm run db:seed

# Start server
npm start
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Using Docker (Alternative)

```bash
cd errandhub-backend
docker-compose up
```

This will start both PostgreSQL and the backend server.

## 🌐 Live Demo

**Frontend:** https://tw3npyhihnooq.ok.kimi.link

> **Note:** The live demo frontend is deployed and ready. To use the full functionality, you need to deploy the backend separately and update the `VITE_API_URL` environment variable.

## 🔑 Test Accounts

After seeding the database:

| Role   | Email                  | Password  |
|--------|------------------------|-----------|
| Admin  | Oleaisah@gmail.com     | Theophilus |
| User   | user@errandhub.com     | user123   |
| Runner | runner@errandhub.com   | runner123 |

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | /api/auth/signup   | Register new user   |
| POST   | /api/auth/login    | Login user          |
| GET    | /api/auth/profile  | Get user profile    |
| PUT    | /api/auth/profile  | Update profile      |

### Order Endpoints

| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| POST   | /api/orders                | Create order          |
| GET    | /api/orders                | Get user's orders     |
| GET    | /api/orders/:id            | Get order details     |
| PUT    | /api/orders/:id/status     | Update order status   |
| PUT    | /api/orders/:id/cancel     | Cancel order          |
| PUT    | /api/orders/:id/rate       | Rate order            |

### Runner Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/runner/profile               | Get runner profile       |
| PUT    | /api/runner/availability          | Update availability      |
| GET    | /api/runner/available-tasks       | Get available tasks      |
| GET    | /api/runner/my-tasks              | Get assigned tasks       |
| POST   | /api/runner/tasks/:id/accept      | Accept task              |
| PUT    | /api/runner/tasks/:id/status      | Update task status       |
| POST   | /api/runner/tasks/:id/receipt     | Upload receipt           |

### Admin Endpoints

| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | /api/admin/dashboard-stats   | Get dashboard stats      |
| GET    | /api/admin/orders            | Get all orders           |
| GET    | /api/admin/users             | Get all users            |
| GET    | /api/admin/runners           | Get all runners          |
| PUT    | /api/admin/orders/:id/price  | Update order price       |

### Chat Endpoints

| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/chat/:orderId    | Get messages        |
| POST   | /api/chat/:orderId    | Send message        |

## 🗄️ Database Schema

### Users Table
- `id` (UUID, PK)
- `first_name`, `last_name`
- `email` (Unique)
- `password_hash`
- `phone`
- `role` (user/runner/admin)
- `is_active`

### Orders Table
- `id` (UUID, PK)
- `order_number` (Unique)
- `user_id` (FK)
- `runner_id` (FK, Nullable)
- `errand_type`
- `status` (pending/confirmed/runner_assigned/item_purchased/on_the_way/delivered/cancelled)
- `total_amount`

### Runners Table
- `id` (UUID, PK)
- `user_id` (FK)
- `vehicle_type`
- `is_available`
- `rating`
- `total_deliveries`

## 🔒 Security Features

- JWT Authentication
- Password Hashing (SHA-256)
- Role-based Access Control
- Input Validation
- Protected Routes
- CORS Configuration

## 🎨 Frontend Features

- Modern React with TypeScript
- Tailwind CSS for styling
- Framer Motion animations
- Responsive design (Mobile/Tablet/Desktop)
- Zustand for state management
- Real-time order tracking
- Chat functionality

## 📦 Deployment

### Frontend Deployed ✅
**Live URL:** https://tw3npyhihnooq.ok.kimi.link

### Backend Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick start:
```bash
cd errandhub-backend
npm install --production
npm start
```

Or use Docker:
```bash
cd errandhub-backend
docker-compose up -d
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=errandhub
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- React Router
- Lucide Icons

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT
- Multer (file uploads)
- Express Validator

## 📄 License

MIT
