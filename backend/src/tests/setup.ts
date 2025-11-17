import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Suppress console logs during tests unless explicitly enabled
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set default test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
