
import { db } from '../db';
import { wishlistItemsTable } from '../db/schema';
import { type WishlistItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getWishlistItems = async (userId: number): Promise<WishlistItem[]> => {
  try {
    const results = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get wishlist items:', error);
    throw error;
  }
};
