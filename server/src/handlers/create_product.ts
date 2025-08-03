
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Verify category exists to prevent foreign key constraint violation
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (category.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity,
        category_id: input.category_id,
        brand: input.brand,
        model: input.model,
        image_urls: input.image_urls,
        specifications: input.specifications,
        is_featured: input.is_featured || false
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
