
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, categoriesTable, wishlistItemsTable } from '../db/schema';
import { type AddToWishlistInput } from '../schema';
import { addToWishlist } from '../handlers/add_to_wishlist';
import { eq, and } from 'drizzle-orm';

describe('addToWishlist', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;
  let testCategoryId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '99.99',
        stock_quantity: 10,
        category_id: testCategoryId,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['http://example.com/image.jpg'],
        specifications: { color: 'black' },
        is_featured: false
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  const testInput: AddToWishlistInput = {
    user_id: 0, // Will be set in beforeEach
    product_id: 0 // Will be set in beforeEach
  };

  it('should add product to wishlist', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    const result = await addToWishlist(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.added_at).toBeInstanceOf(Date);
  });

  it('should save wishlist item to database', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    const result = await addToWishlist(input);

    const wishlistItems = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.id, result.id))
      .execute();

    expect(wishlistItems).toHaveLength(1);
    expect(wishlistItems[0].user_id).toEqual(testUserId);
    expect(wishlistItems[0].product_id).toEqual(testProductId);
    expect(wishlistItems[0].added_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...testInput,
      user_id: 99999,
      product_id: testProductId
    };

    await expect(addToWishlist(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when product does not exist', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: 99999
    };

    await expect(addToWishlist(input)).rejects.toThrow(/product not found/i);
  });

  it('should throw error when product already in wishlist', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    // Add item first time
    await addToWishlist(input);

    // Try to add same item again
    await expect(addToWishlist(input)).rejects.toThrow(/already in wishlist/i);
  });

  it('should allow same product for different users', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashedpassword2',
        first_name: 'Test2',
        last_name: 'User2',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const input1 = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    const input2 = {
      ...testInput,
      user_id: secondUserResult[0].id,
      product_id: testProductId
    };

    // Both should succeed
    const result1 = await addToWishlist(input1);
    const result2 = await addToWishlist(input2);

    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(secondUserResult[0].id);
    expect(result1.product_id).toEqual(testProductId);
    expect(result2.product_id).toEqual(testProductId);

    // Verify both items exist in database
    const wishlistItems = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.product_id, testProductId))
      .execute();

    expect(wishlistItems).toHaveLength(2);
  });
});
