
import { db } from '../db';
import { reviewsTable, usersTable, productsTable, orderItemsTable, ordersTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    // Verify user has purchased this product (check order history)
    const purchaseHistory = await db.select()
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.order_id, ordersTable.id))
      .where(
        and(
          eq(ordersTable.user_id, input.user_id),
          eq(orderItemsTable.product_id, input.product_id)
        )
      )
      .execute();

    if (purchaseHistory.length === 0) {
      throw new Error('User must purchase product before reviewing');
    }

    // Check if user has already reviewed this product
    const existingReview = await db.select()
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.user_id, input.user_id),
          eq(reviewsTable.product_id, input.product_id)
        )
      )
      .execute();

    if (existingReview.length > 0) {
      throw new Error('User has already reviewed this product');
    }

    // Create the review
    const result = await db.insert(reviewsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id,
        rating: input.rating,
        comment: input.comment || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
};
