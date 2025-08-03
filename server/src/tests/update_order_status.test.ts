
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { type UpdateOrderStatusInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrderId: number;

  beforeEach(async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        total_amount: '99.99',
        status: 'pending',
        shipping_address: '123 Test St',
        billing_address: '123 Test St'
      })
      .returning()
      .execute();

    testOrderId = orderResult[0].id;
  });

  it('should update order status successfully', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.status).toEqual('confirmed');
    expect(result.user_id).toEqual(testUserId);
    expect(result.total_amount).toEqual(99.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'shipped'
    };

    await updateOrderStatus(input);

    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, testOrderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('shipped');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle status transitions correctly', async () => {
    // Test progression: pending -> confirmed -> shipped -> delivered
    const statusProgression = ['confirmed', 'shipped', 'delivered'] as const;

    for (const status of statusProgression) {
      const input: UpdateOrderStatusInput = {
        id: testOrderId,
        status
      };

      const result = await updateOrderStatus(input);
      expect(result.status).toEqual(status);

      // Verify in database
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.id, testOrderId))
        .execute();

      expect(orders[0].status).toEqual(status);
    }
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateOrderStatusInput = {
      id: 99999,
      status: 'confirmed'
    };

    expect(updateOrderStatus(input)).rejects.toThrow(/Order with id 99999 not found/i);
  });

  it('should handle cancelled status', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'cancelled'
    };

    const result = await updateOrderStatus(input);

    expect(result.status).toEqual('cancelled');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
