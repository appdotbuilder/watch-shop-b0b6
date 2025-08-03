
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Verify product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error('Product not found');
    }

    // If category_id is being updated, verify it exists
    if (input.category_id !== undefined) {
      const category = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (category.length === 0) {
        throw new Error('Category not found');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price.toString();
    if (input.stock_quantity !== undefined) updateData.stock_quantity = input.stock_quantity;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.image_urls !== undefined) updateData.image_urls = input.image_urls;
    if (input.specifications !== undefined) updateData.specifications = input.specifications;
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
