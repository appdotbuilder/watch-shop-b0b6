
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { removeFromCart } from '../handlers/remove_from_cart';
import { eq } from 'drizzle-orm';

describe('removeFromCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove an item from cart', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg']
      })
      .returning()
      .execute();

    const [cartItem] = await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 2
      })
      .returning()
      .execute();

    // Remove the cart item
    await removeFromCart(cartItem.id);

    // Verify the cart item was removed
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should handle removing non-existent cart item without error', async () => {
    const nonExistentId = 99999;

    // Should not throw an error even if the item doesn't exist
    await expect(removeFromCart(nonExistentId)).resolves.toBeUndefined();
  });

  it('should only remove the specified cart item', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: category.id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg']
      })
      .returning()
      .execute();

    // Create two cart items
    const [cartItem1] = await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 2
      })
      .returning()
      .execute();

    const [cartItem2] = await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 3
      })
      .returning()
      .execute();

    // Remove only the first cart item
    await removeFromCart(cartItem1.id);

    // Verify only the first item was removed
    const item1Results = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem1.id))
      .execute();

    const item2Results = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem2.id))
      .execute();

    expect(item1Results).toHaveLength(0);
    expect(item2Results).toHaveLength(1);
    expect(item2Results[0].quantity).toEqual(3);
  });
});
