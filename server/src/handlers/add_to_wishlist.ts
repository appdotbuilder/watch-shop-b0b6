
import { db } from '../db';
import { wishlistItemsTable, usersTable, productsTable } from '../db/schema';
import { type AddToWishlistInput, type WishlistItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToWishlist = async (input: AddToWishlistInput): Promise<WishlistItem> => {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (products.length === 0) {
      throw new Error('Product not found');
    }

    // Check if item already exists in wishlist
    const existingItems = await db.select()
      .from(wishlistItemsTable)
      .where(and(
        eq(wishlistItemsTable.user_id, input.user_id),
        eq(wishlistItemsTable.product_id, input.product_id)
      ))
      .execute();

    if (existingItems.length > 0) {
      throw new Error('Product already in wishlist');
    }

    // Insert wishlist item
    const result = await db.insert(wishlistItemsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add to wishlist failed:', error);
    throw error;
  }
};
