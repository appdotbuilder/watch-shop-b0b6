
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, categoriesTable, cartItemsTable } from '../db/schema';
import { updateCartItem } from '../handlers/update_cart_item';
import { type UpdateCartItemInput } from '../schema';
import { eq } from 'drizzle-orm';

describe('updateCartItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update cart item quantity', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products',
        image_url: null
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        user_id: userResult[0].id,
        product_id: productResult[0].id,
        quantity: 2
      })
      .returning()
      .execute();

    const testInput: UpdateCartItemInput = {
      id: cartItemResult[0].id,
      quantity: 5
    };

    const result = await updateCartItem(testInput);

    // Verify updated fields
    expect(result.id).toEqual(cartItemResult[0].id);
    expect(result.quantity).toEqual(5);
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.product_id).toEqual(productResult[0].id);
    expect(result.added_at).toBeInstanceOf(Date);
  });

  it('should save updated quantity to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products',
        image_url: null
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        user_id: userResult[0].id,
        product_id: productResult[0].id,
        quantity: 2
      })
      .returning()
      .execute();

    const testInput: UpdateCartItemInput = {
      id: cartItemResult[0].id,
      quantity: 3
    };

    await updateCartItem(testInput);

    // Verify data was saved to database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemResult[0].id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(3);
    expect(cartItems[0].user_id).toEqual(userResult[0].id);
    expect(cartItems[0].product_id).toEqual(productResult[0].id);
  });

  it('should throw error for non-existent cart item', async () => {
    const testInput: UpdateCartItemInput = {
      id: 99999,
      quantity: 5
    };

    await expect(updateCartItem(testInput)).rejects.toThrow(/cart item not found/i);
  });

  it('should update quantity to minimum allowed value', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products',
        image_url: null
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        user_id: userResult[0].id,
        product_id: productResult[0].id,
        quantity: 10
      })
      .returning()
      .execute();

    const testInput: UpdateCartItemInput = {
      id: cartItemResult[0].id,
      quantity: 1
    };

    const result = await updateCartItem(testInput);

    expect(result.quantity).toEqual(1);
    expect(result.id).toEqual(cartItemResult[0].id);
  });
});
