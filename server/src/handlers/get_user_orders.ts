
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserOrders = async (userId: number): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.user_id, userId))
      .orderBy(desc(ordersTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    throw error;
  }
};
