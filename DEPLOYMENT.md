# ErrandHub - Production Deployment Guide

This guide explains how to deploy the full ErrandHub platform to production.

## 📋 Overview

ErrandHub consists of two main components:
1. **Frontend** - React SPA (Single Page Application)
2. **Backend** - Node.js/Express API with PostgreSQL

## 🚀 Deployment Options

### Option 1: Full Docker Deployment (Recommended)

Deploy both frontend and backend using Docker Compose.

```bash
# Clone the repository
git clone <repository-url>
cd errandhub

# Update environment variables
cp errandhub-backend/.env.example errandhub-backend/.env
# Edit .env with your production values

# Build and start all services
docker-compose -f errandhub-backend/docker-compose.yml up -d --build
```

### Option 2: Separate Deployments

#### Backend Deployment

1. **Set up PostgreSQL database**
   - Use managed PostgreSQL (AWS RDS, Google Cloud SQL, or DigitalOcean)
   - Or self-host PostgreSQL on your server

2. **Deploy Node.js Backend**

```bash
cd errandhub-backend

# Install production dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export PORT=5000
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_NAME=errandhub
export DB_USER=your-db-user
export DB_PASSWORD=your-db-password
export JWT_SECRET=your-super-secret-jwt-key

# Initialize database
npm run db:init

# Start server
npm start
```

3. **Using PM2 for process management**

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name errandhub-api

# Save PM2 config
pm2 save
pm2 startup
```

#### Frontend Deployment

1. **Update API URL**

Edit `app/.env`:
```
VITE_API_URL=https://your-api-domain.com/api
```

2. **Build for production**

```bash
cd app
npm install
npm run build
```

3. **Deploy `dist/` folder**
   - Upload to static hosting (Netlify, Vercel, AWS S3, etc.)
   - Or serve with Nginx

### Option 3: Platform-as-a-Service (PaaS)

#### Deploy Backend to Render/Railway/Heroku

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in the dashboard
6. Add PostgreSQL addon

#### Deploy Frontend to Vercel/Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL`

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=errandhub
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend (.env)

```env
VITE_API_URL=https://your-api-domain.com/api
```

## 🛡️ Security Checklist

- [ ] Use strong JWT secret (min 32 characters)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set secure CORS origins
- [ ] Use environment variables for sensitive data
- [ ] Enable PostgreSQL SSL in production
- [ ] Set up rate limiting
- [ ] Configure proper firewall rules
- [ ] Use strong database passwords

## 📊 Monitoring

### Backend Health Check

```bash
curl https://your-api-domain.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs

```bash
# View PM2 logs
pm2 logs errandhub-api

# View Docker logs
docker-compose logs -f backend
```

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            cd /var/www/errandhub-backend
            git pull
            npm install
            npm run db:migrate
            pm2 restart errandhub-api
          EOF

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd app && npm install && npm run build
      - name: Deploy to static hosting
        run: |
          # Upload dist/ to your hosting provider
```

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h your-db-host -U your-db-user -d errandhub

# Check if database exists
\l

# Check tables
\dt
```

### CORS Errors

Update backend CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### File Upload Issues

Ensure uploads directory exists and has proper permissions:

```bash
mkdir -p uploads/receipts
chmod 755 uploads
```

## 📞 Support

For deployment support, please:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure database is accessible
4. Test API endpoints with curl/Postman
