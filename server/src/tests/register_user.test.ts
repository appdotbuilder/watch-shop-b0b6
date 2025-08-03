
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual(testInput.password);
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].is_admin).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle user registration without phone', async () => {
    const inputWithoutPhone: RegisterUserInput = {
      email: 'nophone@example.com',
      password: 'testpassword123',
      first_name: 'Jane',
      last_name: 'Smith'
    };

    const result = await registerUser(inputWithoutPhone);

    expect(result.email).toEqual('nophone@example.com');
    expect(result.phone).toBeNull();
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
  });

  it('should hash the password', async () => {
    const result = await registerUser(testInput);

    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual(testInput.password);
    
    // Verify password was hashed properly by checking it can be verified
    const isValid = await Bun.password.verify(testInput.password, result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should reject duplicate email addresses', async () => {
    // Register first user
    await registerUser(testInput);

    // Attempt to register second user with same email
    const duplicateInput: RegisterUserInput = {
      ...testInput,
      first_name: 'Different',
      last_name: 'User'
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should set default values correctly', async () => {
    const result = await registerUser(testInput);

    expect(result.is_admin).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
