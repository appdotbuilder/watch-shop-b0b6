
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  is_admin: false
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid email', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    // Verify user data
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toEqual('hashed_password_123');
  });

  it('should return correct user data from database', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    // Verify returned data matches database
    expect(result.id).toEqual(insertResult[0].id);
    expect(result.email).toEqual(insertResult[0].email);
    expect(result.first_name).toEqual(insertResult[0].first_name);
    expect(result.last_name).toEqual(insertResult[0].last_name);
    expect(result.phone).toEqual(insertResult[0].phone);
    expect(result.is_admin).toEqual(insertResult[0].is_admin);
    expect(result.created_at).toEqual(insertResult[0].created_at);
    expect(result.updated_at).toEqual(insertResult[0].updated_at);
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle admin users correctly', async () => {
    // Create admin user
    const adminUser = {
      ...testUser,
      email: 'admin@example.com',
      is_admin: true
    };

    await db.insert(usersTable)
      .values(adminUser)
      .execute();

    const adminLoginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'admin_password'
    };

    const result = await loginUser(adminLoginInput);

    expect(result.email).toEqual('admin@example.com');
    expect(result.is_admin).toEqual(true);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
  });
});
