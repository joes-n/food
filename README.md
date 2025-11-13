# Food Ordering & Tracking App

A full-stack food ordering platform built with modern technologies.

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
food-ordering-app/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Custom middleware
│   │   ├── routes/      # API routes
│   │   ├── prisma/      # Database schema & migrations
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── frontend/            # React web application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API service functions
│   │   ├── store/      # State management
│   │   └── types/      # TypeScript types
│   └── package.json
│
└── shared/             # Shared types and utilities
    └── types/
```

## Features

### MVP (Phase 1)
- ✅ User authentication & profiles
- ✅ Restaurant browsing & search
- ✅ Menu browsing & shopping cart
- ✅ Order placement
- ✅ Payment integration (cards, wallets, cash)
- ✅ Order status tracking
- ✅ Admin dashboard

### Phase 2
- 🔲 Real-time driver tracking
- 🔲 Reviews & ratings
- 🔲 Promo codes
- 🔲 Chat system
- 🔲 Order scheduling
- 🔲 Push notifications

### Phase 3
- 🔲 Loyalty program
- 🔲 Advanced analytics
- 🔲 Mobile apps (iOS/Android)

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

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Backend
Deploy to: Heroku, Railway, DigitalOcean, AWS

### Frontend
Deploy to: Vercel, Netlify, GitHub Pages

### Database
Host on: Neon, Supabase, AWS RDS

See `docs/DEPLOYMENT.md` for detailed deployment guide.

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License
