
import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const removeFromCart = async (cartItemId: number): Promise<void> => {
  try {
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .execute();
  } catch (error) {
    console.error('Remove from cart failed:', error);
    throw error;
  }
};
