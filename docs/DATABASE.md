# Database Schema Documentation

This document describes the database schema for the Food Ordering App.

## Overview

The database uses PostgreSQL with Prisma ORM. The schema is designed to support a multi-restaurant marketplace with customers, restaurant owners, drivers, and administrators.

## Entity Relationship Diagram

```
User (customers, owners, drivers, admins)
    │
    ├─ owns → Restaurant
    ├─ places → Order
    ├─ writes → Review
    ├─ favorites → Restaurant
    ├─ delivers → Delivery
    ├─ sends → ChatMessage
    └─ receives ← ChatMessage
            │
Restaurant
    ├─ has many → MenuCategory
    │   └─ has many → MenuItem
    │       └─ has many → MenuItemCustomization
    │           └─ has many → CustomizationOption
    ├─ has many → Order
    ├─ has many → Review
    ├─ has many → OperatingHours
    └─ has many → Favorite
            │
Order
    ├─ has many → OrderItem
    │   └─ has many → SelectedCustomization
    ├─ has one → Payment
    ├─ has one → Delivery
    │   └─ has one → DeliveryRoute
    └─ has one → Review
```

## Tables

### 1. User

**Purpose**: Base table for all users (customers, restaurant owners, drivers, admins)

**Key Fields**:
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Hashed password
- `role`: User type (customer, restaurant_owner, driver, admin)

**Relationships**:
- One-to-One with Restaurant (owner)
- One-to-Many with Order (customer)
- One-to-Many with Review
- One-to-Many with Favorite

### 2. Restaurant

**Purpose**: Stores restaurant information

**Key Fields**:
- `name`: Restaurant name
- `cuisine`: Type of cuisine (Italian, Chinese, etc.)
- `rating`: Average rating (0-5)
- `priceRange`: budget, medium, premium
- `latitude/longitude`: Location for delivery calculations
- `deliveryFee`: Cost for delivery
- `minOrderAmount`: Minimum order for delivery

**Indexes**:
- Owner ID
- Active status
- Cuisine type

### 3. MenuCategory

**Purpose**: Categories within a restaurant's menu

**Key Fields**:
- `name`: Category name (Appetizers, Main Course, etc.)
- `order`: Display order
- `isActive`: Whether category is shown

### 4. MenuItem

**Purpose**: Individual menu items

**Key Fields**:
- `name`: Item name
- `price`: Base price
- `description`: Item description
- `isAvailable`: Whether item can be ordered
- `preparationTime`: Estimated prep time in minutes

**Relationships**:
- Many-to-One with MenuCategory
- One-to-Many with OrderItem

### 5. MenuItemCustomization

**Purpose**: Customization options for menu items (size, toppings, etc.)

**Key Fields**:
- `type`: single (choose one) or multiple (choose many)
- `required`: Whether customer must select

**Example**:
- Size: Small (+$0), Medium (+$2), Large (+$4)
- Toppings: Cheese (+$1), Bacon (+$2)

### 6. CustomizationOption

**Purpose**: Individual options within a customization

**Key Fields**:
- `name`: Option name
- `priceModifier`: Additional cost (can be negative for discounts)

### 7. Order

**Purpose**: Customer orders

**Key Fields**:
- `orderNumber`: Sequential order number for reference
- `status`: Order status flow
  - pending → confirmed → preparing → ready_for_pickup → out_for_delivery → delivered
- `total`: Final total including tax, delivery, discounts
- `deliveryAddress`: Shipping information
- `scheduledFor`: For future scheduled orders

**Status Flow**:
```
pending → confirmed → preparing → out_for_delivery → delivered
                   ↓              ↓
            ready_for_pickup ←────┘
```

### 8. OrderItem

**Purpose**: Individual items within an order

**Key Fields**:
- `menuItemName`: Snapshot of item name at order time
- `price`: Price at order time
- `quantity`: Number of this item
- `subtotal`: price × quantity

### 9. SelectedCustomization

**Purpose**: Track which customizations were selected for each order item

**Key Fields**:
- `optionName`: Snapshot of option name
- `priceModifier`: Cost of this option

### 10. Payment

**Purpose**: Payment transactions

**Key Fields**:
- `amount`: Payment amount
- `paymentMethod`: card, digital_wallet, cash_on_delivery
- `paymentStatus`: pending, completed, failed, refunded
- `transactionId`: External payment gateway ID
- `paidAt`: When payment was completed

### 11. Delivery

**Purpose**: Delivery information and assignment

**Key Fields**:
- `driverId`: Assigned driver
- `status`: Delivery status flow
- `pickupTime`: When driver picked up order
- `deliveryTime`: When order was delivered

### 12. DeliveryRoute

**Purpose**: Delivery route information

**Key Fields**:
- `pickupLatitude/Longitude`: Restaurant location
- `destLatitude/Longitude`: Customer location
- `distance`: Distance in km
- `duration`: Estimated duration in minutes

### 13. Review

**Purpose**: Customer reviews for restaurants

**Key Fields**:
- `rating`: 1-5 star rating
- `comment`: Optional review text

**Note**: One review per order

### 14. Favorite

**Purpose**: Customer favorite restaurants

**Key Fields**:
- Unique constraint on (customerId, restaurantId)

### 15. ChatMessage

**Purpose**: Chat between customers and restaurant owners

**Key Fields**:
- `senderId`: Message sender
- `receiverId`: Message recipient
- `message`: Message content
- `readAt`: When message was read

### 16. PromoCode

**Purpose**: Discount codes and promotions

**Key Fields**:
- `code`: Unique promo code
- `type`: percentage or fixed_amount
- `value`: Discount value
- `maxUses`: Maximum number of uses
- `usedCount`: Current usage count
- `validFrom/validUntil`: Valid date range

### 17. OperatingHours

**Purpose**: Restaurant operating hours

**Key Fields**:
- `dayOfWeek`: 0 (Sunday) to 6 (Saturday)
- `openTime/closeTime`: HH:MM format
- `isClosed`: Whether restaurant is closed this day

## Indexes

The schema includes strategic indexes for performance:

- **User**: Email, Role
- **Restaurant**: Owner ID, Active status, Cuisine
- **Order**: Customer ID, Restaurant ID, Driver ID, Status, Created date, Payment status
- **Menu**: Restaurant ID, Category ID, Availability
- **Payment**: Payment status, Transaction ID
- **Chat**: Sender ID, Receiver ID, Created date

## Enums

```prisma
UserRole {
  customer
  restaurant_owner
  driver
  admin
}

OrderStatus {
  pending
  confirmed
  preparing
  ready_for_pickup
  out_for_delivery
  delivered
  cancelled
}

PaymentMethod {
  card
  digital_wallet
  cash_on_delivery
}

PaymentStatus {
  pending
  completed
  failed
  refunded
}

DeliveryStatus {
  assigned
  picked_up
  in_transit
  delivered
  cancelled
}
```

## Data Integrity

### Cascading Deletes
- User deletion → Cascade to restaurants, orders, reviews, favorites, messages
- Restaurant deletion → Cascade to categories, items, orders, reviews, favorites, operating hours
- Order deletion → Cascade to order items, payment, delivery, review

### Unique Constraints
- User email
- Restaurant name (per owner)
- Favorite (customer + restaurant)
- Chat message ID
- Promo code

### Not Null Constraints
- All ID fields
- Required fields (name, email, password, etc.)
- Order calculations (subtotal, total, etc.)

## Migrations

To create a new migration after changing the schema:

```bash
cd backend
npm run prisma:migrate
```

To reset the database (development only):

```bash
npx prisma migrate reset
```

## Seeding

To seed the database with sample data:

```bash
npm run prisma:seed
```

Sample data includes:
- 1 admin user
- 3 restaurant owners
- 5 customers
- 2 drivers
- 5 restaurants with menus
- Sample orders and reviews

## Best Practices

### When Adding New Fields
1. Always add `createdAt` and `updatedAt` timestamps
2. Use appropriate data types (Float for prices, Int for counts)
3. Add indexes for foreign keys and frequently queried fields
4. Update TypeScript types in `/shared/types/index.ts`

### When Adding New Tables
1. Always include UUID primary key
2. Add `createdAt` timestamp
3. Add indexes for foreign keys
4. Update relationships in related tables
5. Document the table in this file

## Troubleshooting

### Common Issues

**Issue**: Foreign key constraint fails
**Solution**: Ensure referenced record exists before creating dependent record

**Issue**: Duplicate key violation
**Solution**: Check unique constraints and use upsert operations

**Issue**: Migration conflicts
**Solution**: Reset migrations in development, use `--create-only` for production

**Issue**: Performance issues
**Solution**: Add missing indexes, use `explain analyze` to optimize queries

## Connection String Format

```
postgresql://username:password@localhost:5432/food_ordering_db?schema=public
```

For production (Neon):
```
postgresql://username:password@ep-xxx-xxx-xxx-xxx-xxx.neon.tech/food_ordering_db?sslmode=require
```

## Further Reading

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://www.prisma.io/docs/guides/application/database-access-control-prisma)
