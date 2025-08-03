
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { getAllOrders } from '../handlers/get_all_orders';

describe('getAllOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getAllOrders();
    expect(result).toEqual([]);
  });

  it('should return all orders', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
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
          total_amount: '199.99',
          status: 'pending',
          shipping_address: '123 Main St',
          billing_address: '123 Main St'
        },
        {
          user_id: userId,
          total_amount: '299.50',
          status: 'confirmed',
          shipping_address: '456 Oak Ave',
          billing_address: '456 Oak Ave'
        }
      ])
      .execute();

    const result = await getAllOrders();

    expect(result).toHaveLength(2);
    
    // Verify first order
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].total_amount).toEqual(199.99);
    expect(typeof result[0].total_amount).toBe('number');
    expect(result[0].status).toEqual('pending');
    expect(result[0].shipping_address).toEqual('123 Main St');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second order
    expect(result[1].user_id).toEqual(userId);
    expect(result[1].total_amount).toEqual(299.50);
    expect(typeof result[1].total_amount).toBe('number');
    expect(result[1].status).toEqual('confirmed');
    expect(result[1].shipping_address).toEqual('456 Oak Ave');
  });

  it('should return orders with all status types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          user_id: userId,
          total_amount: '100.00',
          status: 'pending',
          shipping_address: '123 Main St',
          billing_address: '123 Main St'
        },
        {
          user_id: userId,
          total_amount: '200.00',
          status: 'shipped',
          shipping_address: '456 Oak Ave',
          billing_address: '456 Oak Ave'
        },
        {
          user_id: userId,
          total_amount: '300.00',
          status: 'delivered',
          shipping_address: '789 Pine Rd',
          billing_address: '789 Pine Rd'
        },
        {
          user_id: userId,
          total_amount: '400.00',
          status: 'cancelled',
          shipping_address: '321 Elm St',
          billing_address: '321 Elm St'
        }
      ])
      .execute();

    const result = await getAllOrders();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(order => order.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('shipped');
    expect(statuses).toContain('delivered');
    expect(statuses).toContain('cancelled');
  });
});
