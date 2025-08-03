
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { getUserOrders } from '../handlers/get_user_orders';

describe('getUserOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return orders for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test orders
    await db.insert(ordersTable)
      .values([
        {
          user_id: userId,
          total_amount: '99.99',
          status: 'delivered',
          shipping_address: '123 Main St',
          billing_address: '123 Main St'
        },
        {
          user_id: userId,
          total_amount: '149.50',
          status: 'pending',
          shipping_address: '456 Oak Ave',
          billing_address: '456 Oak Ave'
        }
      ])
      .execute();

    const orders = await getUserOrders(userId);

    expect(orders).toHaveLength(2);
    expect(orders[0].user_id).toEqual(userId);
    expect(orders[1].user_id).toEqual(userId);
    expect(typeof orders[0].total_amount).toBe('number');
    expect(typeof orders[1].total_amount).toBe('number');
    expect(orders[0].id).toBeDefined();
    expect(orders[0].created_at).toBeInstanceOf(Date);
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return orders ordered by created_at descending', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create orders with slight delay to ensure different timestamps
    const firstOrder = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '99.99',
        status: 'delivered',
        shipping_address: '123 Main St',
        billing_address: '123 Main St'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondOrder = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '149.50',
        status: 'pending',
        shipping_address: '456 Oak Ave',
        billing_address: '456 Oak Ave'
      })
      .returning()
      .execute();

    const orders = await getUserOrders(userId);

    expect(orders).toHaveLength(2);
    // Most recent order should be first
    expect(orders[0].created_at >= orders[1].created_at).toBe(true);
  });

  it('should return empty array for user with no orders', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const orders = await getUserOrders(userId);

    expect(orders).toHaveLength(0);
  });

  it('should only return orders for specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create orders for both users
    await db.insert(ordersTable)
      .values([
        {
          user_id: user1Id,
          total_amount: '99.99',
          status: 'delivered',
          shipping_address: '123 Main St',
          billing_address: '123 Main St'
        },
        {
          user_id: user2Id,
          total_amount: '149.50',
          status: 'pending',
          shipping_address: '456 Oak Ave',
          billing_address: '456 Oak Ave'
        }
      ])
      .execute();

    const user1Orders = await getUserOrders(user1Id);
    const user2Orders = await getUserOrders(user2Id);

    expect(user1Orders).toHaveLength(1);
    expect(user2Orders).toHaveLength(1);
    expect(user1Orders[0].user_id).toEqual(user1Id);
    expect(user2Orders[0].user_id).toEqual(user2Id);
  });
});
