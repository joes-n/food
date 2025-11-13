# API Documentation

This document describes all API endpoints for the Food Ordering App.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }, // Response data
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Optional validation details
}
```

---

## Authentication Endpoints

### Register
Create a new user account.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "customer", // customer | restaurant_owner | driver | admin
  "phone": "+1234567890"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer",
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "User already exists with this email"
}
```

### Login
Authenticate user and get JWT token.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer",
      "phone": "+1234567890",
      "avatar": "string"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### Get Current User
Get the currently authenticated user's profile.

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "phone": "+1234567890",
    "avatar": "string",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### Update Profile
Update the current user's profile information.

**Endpoint**: `PUT /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Smith",
    "role": "customer",
    "phone": "+1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ]
}
```

### Change Password
Change the current user's password.

**Endpoint**: `PUT /auth/change-password`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

## User Roles

### Customer
- Can browse restaurants and menus
- Can place orders
- Can track orders
- Can write reviews
- Can chat with restaurants

### Restaurant Owner
- Can manage restaurant profile
- Can manage menu items and categories
- Can view and manage orders
- Can chat with customers

### Driver
- Can view assigned deliveries
- Can update delivery status
- Can update location for tracking

### Admin
- Can manage all restaurants
- Can view all orders
- Can manage users
- Can view platform analytics

---

## HTTP Status Codes

- `200` - OK: Request succeeded
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required or failed
- `403` - Forbidden: Not authorized to access resource
- `404` - Not Found: Resource not found
- `500` - Internal Server Error: Server error

---

## Rate Limiting

Rate limits are applied to API endpoints:
- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641234567
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Authentication token is missing or invalid |
| USER_NOT_FOUND | User does not exist |
| INVALID_PASSWORD | Password is incorrect |
| EMAIL_EXISTS | Email already registered |
| VALIDATION_ERROR | Request validation failed |
| UNAUTHORIZED | User doesn't have permission |
| NOT_FOUND | Requested resource not found |
| SERVER_ERROR | Internal server error |

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Token Expiration

JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN` environment variable).

When a token expires, the API will return a 401 error. The client should then prompt the user to login again.

---

## Best Practices

1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Handle token expiration**: Implement automatic token refresh
3. **Validate on client**: Always validate inputs before sending to API
4. **Handle errors gracefully**: Show user-friendly error messages
5. **Use HTTPS**: Always use HTTPS in production
6. **Keep tokens confidential**: Never expose tokens in client-side code

---

## Postman Collection

A Postman collection is available in the `/docs` directory with all endpoints pre-configured.

Import the collection and set up environment variables:
- `baseUrl`: API base URL
- `token`: JWT token (set after login)

---

## SDK/Libraries

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};
```

### Python

```python
import requests

api = requests.Session()
api.headers.update({'Content-Type': 'application/json'})

# Login
def login(email, password):
    response = api.post('http://localhost:5000/api/auth/login', json={
        'email': email,
        'password': password
    })
    token = response.json()['data']['token']
    api.headers.update({'Authorization': f'Bearer {token}'})
    return response.json()
```

---

## WebSocket Events (for Real-time Features)

### Connect
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

**Join order room for tracking**:
```javascript
socket.emit('join-order', 'order-id');
```

**Join restaurant room**:
```javascript
socket.emit('join-restaurant', 'restaurant-id');
```

**Join user room**:
```javascript
socket.emit('join-user', 'user-id');
```

**Send location update (drivers only)**:
```javascript
socket.emit('driver-location-update', {
  orderId: 'order-id',
  lat: 37.7749,
  lng: -122.4194
});
```

### Listen for events

**Order status updates**:
```javascript
socket.on('order-status-update', (data) => {
  console.log('Order status:', data.status);
});
```

**Driver location updates**:
```javascript
socket.on('location-update', (data) => {
  console.log('Driver location:', data.lat, data.lng);
});
```

**New chat messages**:
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

---

## Coming Soon

Additional endpoints will be added for:
- Restaurant management
- Menu management
- Order placement and tracking
- Payment processing
- Review system
- Chat system
- Admin dashboard

See individual feature documentation for details.
