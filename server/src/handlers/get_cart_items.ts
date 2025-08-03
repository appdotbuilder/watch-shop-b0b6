
import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { type CartItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getCartItems = async (userId: number): Promise<CartItem[]> => {
  try {
    const results = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get cart items:', error);
    throw error;
  }
};
