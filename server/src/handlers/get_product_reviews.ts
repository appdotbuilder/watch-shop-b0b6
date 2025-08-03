
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductReviews = async (productId: number): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.product_id, productId))
      .execute();

    return results.map(review => ({
      ...review,
      // No numeric conversions needed - all fields are already correct types
      // rating is integer, others are already proper types
    }));
  } catch (error) {
    console.error('Failed to fetch product reviews:', error);
    throw error;
  }
};
