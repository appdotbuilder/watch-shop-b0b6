
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput } from '../schema';
import { addToCart } from '../handlers/add_to_cart';
import { eq, and } from 'drizzle-orm';

describe('addToCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        category_id: categoryResult[0].id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg'],
        specifications: { color: 'red' },
        is_featured: false
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  it('should add a new item to cart', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    const result = await addToCart(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.added_at).toBeInstanceOf(Date);
  });

  it('should save cart item to database', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 3
    };

    const result = await addToCart(input);

    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, result.id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].user_id).toEqual(testUserId);
    expect(cartItems[0].product_id).toEqual(testProductId);
    expect(cartItems[0].quantity).toEqual(3);
  });

  it('should update quantity if item already exists in cart', async () => {
    // Add initial item
    const initialInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    await addToCart(initialInput);

    // Add same item again
    const additionalInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 3
    };

    const result = await addToCart(additionalInput);

    expect(result.quantity).toEqual(5); // 2 + 3

    // Verify only one cart item exists
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(and(
        eq(cartItemsTable.user_id, testUserId),
        eq(cartItemsTable.product_id, testProductId)
      ))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(5);
  });

  it('should throw error for non-existent user', async () => {
    const input: AddToCartInput = {
      user_id: 99999,
      product_id: testProductId,
      quantity: 1
    };

    expect(addToCart(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent product', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: 99999,
      quantity: 1
    };

    expect(addToCart(input)).rejects.toThrow(/product not found/i);
  });

  it('should throw error when quantity exceeds stock', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 150 // Product has stock_quantity of 100
    };

    expect(addToCart(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error when updated quantity exceeds stock', async () => {
    // Add initial item with high quantity
    const initialInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 80
    };

    await addToCart(initialInput);

    // Try to add more that would exceed stock
    const additionalInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 25 // 80 + 25 = 105, exceeds stock of 100
    };

    expect(addToCart(additionalInput)).rejects.toThrow(/insufficient stock/i);
  });
});
