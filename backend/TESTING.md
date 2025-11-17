# Backend Testing Guide

This document provides information about the testing setup for the food ordering application backend.

## Table of Contents

- [Test Structure](#test-structure)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)

## Test Structure

```
backend/src/tests/
├── controllers/          # Unit tests for controllers
│   └── authController.test.ts
├── middleware/           # Unit tests for middleware
│   └── auth.test.ts
├── integration/          # Integration tests
│   └── auth.integration.test.ts
├── utils/               # Test utilities and helpers
│   └── testUtils.ts
├── setup.ts             # Jest setup file
└── types/               # Type definitions for tests
    └── jest.d.ts
```

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual functions or methods in isolation.

- **Controller Tests** (`src/tests/controllers/authController.test.ts`)
  - Test each controller function independently
  - Mock external dependencies (Prisma, bcrypt, jwt)
  - Verify proper handling of success and error cases

- **Middleware Tests** (`src/tests/middleware/auth.test.ts`)
  - Test authentication and authorization middleware
  - Mock JWT verification
  - Test various scenarios (valid token, invalid token, missing token, etc.)

### 2. Integration Tests

Integration tests test the complete flow through the API endpoints.

- **Auth Integration Tests** (`src/tests/integration/auth.integration.test.ts`)
  - Test full HTTP request/response cycle
  - Use supertest for making requests
  - Use real database (test database) for verification
  - Test all auth routes: register, login, getCurrentUser, updateProfile, changePassword

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Ensure you have a test database set up (see `.env.test`)

### Available Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only controller tests
npm test -- authController

# Run only middleware tests
npm test -- auth.test

# Run only integration tests
npm test -- integration
```

## Test Coverage

The project is configured to maintain a minimum of 70% code coverage across:
- Branches
- Functions
- Lines
- Statements

Run `npm run test:coverage` to generate a detailed coverage report in the `coverage/` directory.

## Writing Tests

### Unit Test Example

```typescript
import { yourFunction } from '../../controllers/yourController';
import { createMockRequest, createMockResponse } from '../utils/testUtils';

describe('Your Controller', () => {
  it('should handle success case', async () => {
    // Arrange
    const req = createMockRequest({ body: { /* data */ } });
    const res = createMockResponse();
    const next = createMockNext();

    // Mock dependencies
    mockYourDependency.mockResolvedValue(mockedData);

    // Act
    await yourFunction(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expectedData,
    });
  });
});
```

### Integration Test Example

```typescript
import supertest from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';

describe('Auth Integration', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'customer',
    };

    const response = await supertest(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
  });
});
```

## Mocking

### Prisma

```typescript
import { prisma } from '../../server';

// Mock Prisma
jest.mock('../../server', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Use in tests
mockPrisma.user.findUnique.mockResolvedValue(mockedUser);
```

### JWT

```typescript
import jwt from 'jsonwebtoken';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Use in tests
mockJwt.sign.mockReturnValue('mock-jwt-token');
mockJwt.verify.mockReturnValue(decodedToken);
```

### Bcrypt

```typescript
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Use in tests
mockBcrypt.hash.mockResolvedValue('hashedPassword');
mockBcrypt.compare.mockResolvedValue(true);
```

## Test Database

The integration tests use a separate test database configured in `.env.test`.

### Database Setup

```bash
# Create test database
createdb test_db

# Run migrations
npx prisma migrate deploy --schema=prisma/schema.prisma

# Seed test data (if needed)
npx prisma db seed
```

### Cleaning Up Tests

Tests should clean up after themselves:

```typescript
afterAll(async () => {
  // Delete test users
  await prisma.user.deleteMany({
    where: { email: { in: ['test@example.com'] } },
  });

  // Disconnect Prisma
  await prisma.$disconnect();
});
```

## Best Practices

1. **Test Structure**: Use AAA pattern (Arrange, Act, Assert)
2. **Naming**: Test names should be descriptive of what they're testing
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies, not the code being tested
5. **Coverage**: Aim for high coverage but prioritize meaningful tests
6. **Edge Cases**: Test error conditions and edge cases
7. **Cleanup**: Always clean up test data after tests complete

## Continuous Integration

Tests are configured to run in CI/CD pipelines. The test command will:
- Run all tests
- Generate coverage report
- Fail if coverage threshold is not met
- Exit with appropriate status code

## Troubleshooting

### Tests Not Running

Check if Jest is properly configured:
```bash
npx jest --showConfig
```

### Database Connection Issues

Ensure:
- Test database is running
- DATABASE_URL in `.env.test` is correct
- Database permissions are set correctly

### Mock Not Working

Check if mocks are:
- Properly imported
- Cleared in `beforeEach`
- Called with correct arguments

## Adding New Tests

When adding new features:

1. Create unit tests in appropriate `controllers/` or `middleware/` directory
2. Add integration tests if the feature has API endpoints
3. Update coverage as needed
4. Follow existing test patterns and naming conventions

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
