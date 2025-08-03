
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch all orders:', error);
    throw error;
  }
};
