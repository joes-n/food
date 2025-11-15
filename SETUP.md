# Setup Guide

This guide will help you set up the food ordering app locally.

## Prerequisites

Install these tools on your machine:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 15+** - Download from [postgresql.org](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

Verify installations:
```bash
node --version    # Should be v18 or higher
npm --version     # Should be 8 or higher
psql --version    # Should be 15 or higher
```

## Step 1: Database Setup

1. **Start PostgreSQL service**:
   ```bash
   # macOS (using Homebrew)
   brew services start postgresql

   # Linux
   sudo service postgresql start

   # Windows
   # Use pgAdmin or start from Services app
   ```

2. **Create database**:
   ```bash
   psql -U postgres
   CREATE DATABASE food_ordering_db;
   CREATE USER food_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE food_ordering_db TO food_user;
   \q
   ```

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
CREATE DATABASE food_ordering_db;
   CREATE USER food_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE food_ordering_db TO food_user;
   \q   cp .env.example .env
   ```
   Edit `.env` file and update:
   ```env
   DATABASE_URL="postgresql://food_user:your_password@localhost:5432/food_ordering_db?schema=public"
   JWT_SECRET="your-secret-key-here-make-it-long-and-random"
   CLIENT_URL="http://localhost:3000"
   ```

4. **Generate Prisma client**:
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**:
   ```bash
   npm run prisma:migrate
   ```
   When prompted, choose `y` to create a new migration. Name it something like "init".

6. **Seed database (optional)**:
   ```bash
   npm run prisma:seed
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```
   Backend will be available at: http://localhost:5000
   You should see {"error":{"message":"Route not found"}} indicating a 404 error

   Test with:
   ```bash
   curl http://localhost:5000/api/health
   ```

## Step 3: Frontend Setup

1. **Open a new terminal** and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   The default values should work for local development.

4. **Start development server**:
   ```bash
   npm run dev
   ```
   Frontend will be available at: http://localhost:3000

## Step 4: Verify Setup

1. **Check backend health**:
   Open browser: http://localhost:5000/api/health
   Expected: `{"status":"ok","timestamp":"...","uptime":...}`

2. **Check frontend**:
   Open browser: http://localhost:3000
   Expected: Welcome page with navigation

## Common Issues & Solutions

### Issue: Database connection error
**Solution**:
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -l`

### Issue: Port 5000/3000 already in use
**Solution**:
   ```bash
   # Kill process using the port
   lsof -ti:5000 | xargs kill -9  # Backend
   lsof -ti:3000 | xargs kill -9  # Frontend
   ```
   Or change ports in configuration files.

### Issue: Prisma client not found
**Solution**:
   ```bash
   cd backend
   npm run prisma:generate
   ```

### Issue: Module not found errors
**Solution**:
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: CORS errors
**Solution**:
- Ensure CLIENT_URL in backend `.env` matches frontend URL
- Check CORS configuration in `backend/src/server.ts`

## Development Workflow

### Making Changes

1. **Backend changes**:
   - Edit files in `backend/src/`
   - Server auto-restarts (nodemon)
   - No need to rebuild

2. **Frontend changes**:
   - Edit files in `frontend/src/`
   - Vite auto-refreshes browser
   - Changes appear instantly

3. **Database schema changes**:
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npm run prisma:migrate
   npm run prisma:generate
   ```

### Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start server
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Create new migration
npm run build            # Build for production

# Frontend
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

## Next Steps

After successful setup:
1. Review database schema: `backend/prisma/schema.prisma`
2. Check API routes: `backend/src/routes/`
3. Examine frontend components: `frontend/src/components/`
4. Review app features in `APP_REQUIREMENTS.md`

## Getting Help

- Check logs in terminal output
- Backend logs: `backend/logs/combined.log`
- Prisma issues: Run `npx prisma debug`
- Database issues: Check `npm run prisma:studio`

## Production Deployment

When ready to deploy:
1. Set up production database (Neon, Supabase, or AWS RDS)
2. Update `DATABASE_URL` in production environment
3. Use `npm run build` for both backend and frontend
4. Configure environment variables on hosting platform
5. See `docs/DEPLOYMENT.md` for detailed guide

---

**Happy coding!** 🚀
