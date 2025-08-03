
import { db } from '../db';
import { cartItemsTable, productsTable, usersTable } from '../db/schema';
import { type AddToCartInput, type CartItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToCart = async (input: AddToCartInput): Promise<CartItem> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists and has sufficient stock
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    if (product[0].stock_quantity < input.quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingCartItem = await db.select()
      .from(cartItemsTable)
      .where(and(
        eq(cartItemsTable.user_id, input.user_id),
        eq(cartItemsTable.product_id, input.product_id)
      ))
      .execute();

    if (existingCartItem.length > 0) {
      // Update existing cart item quantity
      const newQuantity = existingCartItem[0].quantity + input.quantity;
      
      // Check if new total quantity exceeds stock
      if (newQuantity > product[0].stock_quantity) {
        throw new Error('Insufficient stock');
      }

      const result = await db.update(cartItemsTable)
        .set({ quantity: newQuantity })
        .where(eq(cartItemsTable.id, existingCartItem[0].id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Insert new cart item
      const result = await db.insert(cartItemsTable)
        .values({
          user_id: input.user_id,
          product_id: input.product_id,
          quantity: input.quantity
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Add to cart failed:', error);
    throw error;
  }
};
