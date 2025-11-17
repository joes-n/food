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
- `name`: User's name
- `role`: User type (customer, restaurant_owner, driver, admin)
- `phone`: Optional phone number
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- One-to-Many with Restaurant (owner)
- One-to-Many with Order (customer)
- One-to-Many with Review
- One-to-Many with Favorite
- One-to-Many with Delivery (driver)
- One-to-Many with ChatMessage (sent and received)

### 2. Restaurant

**Purpose**: Stores restaurant information

**Key Fields**:
- `id`: Restaurant identifier (uses owner ID as primary key)
- `name`: Unique restaurant name
- `description`: Restaurant description
- `logo`: Optional logo image URL
- `banner`: Optional banner image URL
- `cuisine`: Type of cuisine (Italian, Chinese, etc.)
- `rating`: Average rating (0-5)
- `totalReviews`: Total number of reviews
- `priceRange`: budget, medium, premium
- `address`: Physical address
- `latitude/longitude`: Location for delivery calculations
- `phone`: Optional phone number
- `email`: Optional email address
- `ownerId`: ID of the restaurant owner (links to User.id)
- `isActive`: Whether restaurant is active
- `isOpen`: Whether restaurant is currently open
- `deliveryFee`: Cost for delivery
- `minOrderAmount`: Minimum order for delivery
- `estimatedDeliveryTime`: Estimated delivery time in minutes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

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
- `id`: UUID primary key
- `restaurantId`: References the restaurant
- `categoryId`: References the menu category
- `name`: Item name
- `price`: Base price
- `description`: Item description
- `image`: Optional item image URL
- `isAvailable`: Whether item can be ordered
- `preparationTime`: Optional estimated prep time in minutes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with MenuCategory
- One-to-Many with OrderItem
- One-to-Many with MenuItemCustomization

**Indexes**:
- Restaurant ID
- Category ID
- Availability status

### 5. MenuItemCustomization

**Purpose**: Customization options for menu items (size, toppings, etc.)

**Key Fields**:
- `id`: UUID primary key
- `menuItemId`: References the menu item
- `name`: Customization group name (e.g., "Size", "Toppings")
- `type`: single (choose one) or multiple (choose many)
- `required`: Whether customer must select
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with MenuItem
- One-to-Many with CustomizationOption
- One-to-Many with SelectedCustomization

**Example**:
- Size: Small (+$0), Medium (+$2), Large (+$4)
- Toppings: Cheese (+$1), Bacon (+$2)

### 6. CustomizationOption

**Purpose**: Individual options within a customization

**Key Fields**:
- `id`: UUID primary key
- `menuItemCustomizationId`: References the customization group
- `name`: Option name
- `priceModifier`: Additional cost (can be negative for discounts)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with MenuItemCustomization
- One-to-Many with SelectedCustomization

### 7. Order

**Purpose**: Customer orders

**Key Fields**:
- `id`: UUID primary key
- `customerId`: References the customer (User.id)
- `restaurantId`: References the restaurant
- `driverId`: Optional assigned driver (User.id)
- `orderNumber`: Sequential order number for reference
- `subtotal`: Items total before tax and delivery
- `deliveryFee`: Delivery cost
- `discount`: Discount amount
- `total`: Final total including tax, delivery, discounts
- `status`: Order status (OrderStatus enum)
  - pending → confirmed → preparing → ready_for_pickup → out_for_delivery → delivered
- `paymentMethod`: Payment method (PaymentMethod enum)
- `paymentStatus`: Payment status (PaymentStatus enum)
- `deliveryStreet`: Delivery street address
- `deliveryLatitude`: Optional delivery location latitude
- `deliveryLongitude`: Optional delivery location longitude
- `deliveryInstructions`: Optional delivery instructions
- `scheduledFor`: Optional scheduled delivery time
- `notes`: Optional order notes
- `estimatedDeliveryTime`: Estimated delivery time
- `actualDeliveryTime`: Actual delivery completion time
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Status Flow**:
```
pending → confirmed → preparing → out_for_delivery → delivered
                   ↓              ↓
            ready_for_pickup ←────┘
```

**Relationships**:
- Many-to-One with User (customer)
- Many-to-One with Restaurant
- Many-to-One with User (driver, optional)
- One-to-Many with OrderItem
- One-to-One with Payment
- One-to-One with Delivery
- One-to-One with Review

### 8. OrderItem

**Purpose**: Individual items within an order

**Key Fields**:
- `id`: UUID primary key
- `orderId`: References the order
- `menuItemId`: References the menu item
- `menuItemName`: Snapshot of item name at order time
- `price`: Price at order time
- `quantity`: Number of this item
- `subtotal`: price × quantity
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with Order
- Many-to-One with MenuItem
- One-to-Many with SelectedCustomization

### 9. SelectedCustomization

**Purpose**: Track which customizations were selected for each order item

**Key Fields**:
- `id`: UUID primary key
- `orderItemId`: References the order item
- `customizationId`: References the customization group
- `optionId`: References the selected option
- `optionName`: Snapshot of option name
- `priceModifier`: Cost of this option
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with OrderItem
- Many-to-One with MenuItemCustomization
- Many-to-One with CustomizationOption

### 10. Payment

**Purpose**: Payment transactions

**Key Fields**:
- `id`: UUID primary key
- `orderId`: Unique reference to the order
- `amount`: Payment amount
- `paymentMethod`: Payment method (PaymentMethod enum)
- `paymentStatus`: Payment status (PaymentStatus enum)
- `transactionId`: Optional external payment gateway ID
- `paymentIntentId`: Optional payment intent ID
- `paidAt`: Optional payment completion timestamp
- `refundedAt`: Optional refund timestamp
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- One-to-One with Order

**Indexes**:
- Payment status
- Transaction ID

### 11. Delivery

**Purpose**: Delivery information and assignment

**Key Fields**:
- `id`: UUID primary key
- `orderId`: Unique reference to the order
- `driverId`: Assigned driver (User.id)
- `pickupTime`: Optional pickup timestamp
- `deliveryTime`: Optional delivery completion timestamp
- `status`: Delivery status (DeliveryStatus enum)
- `distance`: Optional distance in km
- `estimatedDuration`: Optional estimated duration in minutes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- One-to-One with Order
- Many-to-One with User (driver)
- One-to-One with DeliveryRoute

**Indexes**:
- Driver ID
- Delivery status

### 12. DeliveryRoute

**Purpose**: Delivery route information

**Key Fields**:
- `id`: UUID primary key
- `deliveryId`: Unique reference to the delivery
- `pickupLatitude`: Restaurant location latitude
- `pickupLongitude`: Restaurant location longitude
- `destLatitude`: Customer location latitude
- `destLongitude`: Customer location longitude
- `distance`: Distance in km
- `duration`: Estimated duration in minutes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- One-to-One with Delivery

### 13. Review

**Purpose**: Customer reviews for restaurants

**Key Fields**:
- `id`: UUID primary key
- `orderId`: Unique reference to the order
- `customerId`: References the customer
- `restaurantId`: References the restaurant
- `rating`: 1-5 star rating
- `comment`: Optional review text
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- One-to-One with Order
- Many-to-One with User (customer)
- Many-to-One with Restaurant

**Note**: One review per order

**Indexes**:
- Customer ID
- Restaurant ID
- Rating

### 14. Favorite

**Purpose**: Customer favorite restaurants

**Key Fields**:
- `id`: UUID primary key
- `customerId`: References the customer
- `restaurantId`: References the restaurant
- `createdAt`: Record creation timestamp

**Relationships**:
- Many-to-One with User (customer)
- Many-to-One with Restaurant

**Unique Constraints**:
- (customerId, restaurantId) combination must be unique

**Indexes**:
- Customer ID
- Restaurant ID

### 15. ChatMessage

**Purpose**: Chat between users (customers, restaurant owners, drivers, admins)

**Key Fields**:
- `id`: UUID primary key
- `senderId`: References the sender (User.id)
- `receiverId`: References the receiver (User.id)
- `message`: Message content
- `createdAt`: Record creation timestamp
- `readAt`: Optional read timestamp

**Relationships**:
- Many-to-One with User (sender)
- Many-to-One with User (receiver)

**Indexes**:
- Sender ID
- Receiver ID
- Creation date

### 16. PromoCode

**Purpose**: Discount codes and promotions

**Key Fields**:
- `id`: UUID primary key
- `code`: Unique promo code
- `description`: Optional promo code description
- `type`: percentage or fixed_amount
- `value`: Discount value
- `minOrderAmount`: Optional minimum order amount required
- `maxUses`: Optional maximum number of uses
- `usedCount`: Current usage count (default: 0)
- `validFrom`: Start date
- `validUntil`: End date
- `isActive`: Whether the promo code is active
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Indexes**:
- Active status
- Promo code
- Valid date range

### 17. OperatingHours

**Purpose**: Restaurant operating hours

**Key Fields**:
- `id`: UUID primary key
- `restaurantId`: References the restaurant
- `dayOfWeek`: 0 (Sunday) to 6 (Saturday)
- `openTime`: Opening time in HH:MM format
- `closeTime`: Closing time in HH:MM format
- `isClosed`: Whether restaurant is closed this day
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One with Restaurant

**Unique Constraints**:
- (restaurantId, dayOfWeek) combination must be unique

**Indexes**:
- Restaurant ID

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
