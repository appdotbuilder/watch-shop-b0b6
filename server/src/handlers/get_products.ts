
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsInput, type Product } from '../schema';
import { eq, like, gte, lte, and, desc, or, ilike, type SQL } from 'drizzle-orm';

export const getProducts = async (input?: GetProductsInput): Promise<Product[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.category_id !== undefined) {
      conditions.push(eq(productsTable.category_id, input.category_id));
    }

    if (input?.brand) {
      conditions.push(eq(productsTable.brand, input.brand));
    }

    if (input?.min_price !== undefined) {
      conditions.push(gte(productsTable.price, input.min_price.toString()));
    }

    if (input?.max_price !== undefined) {
      conditions.push(lte(productsTable.price, input.max_price.toString()));
    }

    if (input?.is_featured !== undefined) {
      conditions.push(eq(productsTable.is_featured, input.is_featured));
    }

    if (input?.search) {
      const searchPattern = `%${input.search}%`;
      conditions.push(
        or(
          ilike(productsTable.name, searchPattern),
          ilike(productsTable.description, searchPattern)
        )!
      );
    }

    // Build query with method chaining - use any to bypass type issues
    let query: any = db.select().from(productsTable);
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    query = query.orderBy(desc(productsTable.created_at));
    
    if (input?.limit !== undefined) {
      query = query.limit(input.limit);
    }
    
    if (input?.offset !== undefined) {
      query = query.offset(input.offset);
    }

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map((product: any) => ({
      ...product,
      price: parseFloat(product.price)
    })) as Product[];
  } catch (error) {
    console.error('Get products failed:', error);
    throw error;
  }
};
