# LettucEat
![alt text](https://www.freshpoint.com/wp-content/uploads/commodity-iceberg.jpg)  

A food ordering and tracking platform.

## Documentation
- `DOCKER-SETUP.md` for docker setup (recommended)
- `SETUP.md` for step-by-step local setup
- `ARCHITECTURE_AND_TECH_STACK.md` for design decisions
- `IMAGE_UPLOAD_GUIDE.md` for banner uploads
- `OWNER_ACCOUNTS.md` and `DRIVER_DASHBOARD_PLAN.md` for role-specific flows
- `docs/API.md` and `docs/DATABASE.md` for API + schema details
- `docs/RAILWAY_DEPLOYMENT.md` for the current deployment walkthrough

## Tech Stack

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Socket.io** for real-time features
- **JWT** authentication

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Socket.io-client** for real-time updates

## Project Structure

```
food/
├── backend/                      # Express.js API server
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic helpers
│   │   ├── middleware/          # Auth, validation, etc.
│   │   ├── routes/              # API routes
│   │   ├── prisma/              # Migrations, seed script
│   │   ├── utils/               # Validation helpers, formatters
│   │   ├── lib/                 # Prisma client, shared libs
│   │   └── server.ts            # App entrypoint
│   ├── prisma/schema.prisma
│   ├── .env.example
│   └── package.json
│
├── frontend/                    # React web application (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── vite.config.ts
│   ├── .env.example
│   └── package.json
│
├── shared/types/                # Shared type definitions
└── docs/                        # API/DB/deployment references
```

## Features
- Authentication with JWT and role-aware guards (customer, restaurant_owner, driver, admin)
- Restaurant management: menus, categories, customizations, availability, image uploads
- Ordering flow with order items, scheduling support, status management, and Stripe-based payments/refunds
- Driver operations: delivery assignment, status/location updates, earnings
- Real-time updates over Socket.io (order status, driver location)
- Restaurant analytics endpoints and owner/driver/admin dashboards in the frontend
- Additional models available in the schema for future work (promos, reviews, chat, loyalty)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or pnpm

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Setup database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

6. Start development server:
```bash
npm run dev
```

Backend will run on http://localhost:5000
See `.env.example` for optional email/payment configuration.

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Database Schema

Main entities:
- **Users**: Customers, restaurant owners, drivers, admins
- **Restaurants**: Restaurant info, menu categories, menu items
- **Orders**: Orders with items, status, payments
- **Deliveries**: Driver assignments and delivery info
- **Reviews**: Customer reviews for restaurants

See `docs/DATABASE.md` for detailed schema.

## API Documentation

API endpoints are organized by resource:
- `/api/auth` - Authentication (login, register)
- `/api/users` - User profiles
- `/api/restaurants` - Restaurant browsing, management
- `/api/menus` - Menu items
- `/api/orders` - Order creation, tracking
- `/api/deliveries` - Delivery management
- `/api/reviews` - Reviews and ratings

See `docs/API.md` for detailed API documentation.

## Real-time Features

Using Socket.io for:
- **Order tracking**: Live status updates
- **Driver location**: Real-time location sharing
- **Chat**: Customer-restaurant communication

## Testing

- Backend: `cd backend && npm test`
- Frontend: no automated tests yet (lint/format scripts available)

## Deployment

### Backend
Deploy to: Heroku, Railway, DigitalOcean, AWS

### Frontend
Deploy to: Vercel, Netlify, GitHub Pages

### Database
Host on: Neon, Supabase, AWS RDS

See `docs/RAILWAY_DEPLOYMENT.md` for the current deployment guide.

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License
