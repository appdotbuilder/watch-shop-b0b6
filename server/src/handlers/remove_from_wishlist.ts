
import { db } from '../db';
import { wishlistItemsTable } from '../db/schema';
import { type RemoveFromWishlistInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export const removeFromWishlist = async (input: RemoveFromWishlistInput): Promise<void> => {
  try {
    await db.delete(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.user_id, input.user_id),
          eq(wishlistItemsTable.product_id, input.product_id)
        )
      )
      .execute();
  } catch (error) {
    console.error('Remove from wishlist failed:', error);
    throw error;
  }
};
