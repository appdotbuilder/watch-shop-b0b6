
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, wishlistItemsTable } from '../db/schema';
import { type RemoveFromWishlistInput } from '../schema';
import { removeFromWishlist } from '../handlers/remove_from_wishlist';
import { and, eq } from 'drizzle-orm';

const testInput: RemoveFromWishlistInput = {
  user_id: 1,
  product_id: 1
};

describe('removeFromWishlist', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove item from wishlist', async () => {
    // Create test user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User'
    }).execute();

    // Create test category
    await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      name: 'Test Product',
      description: 'A test product',
      price: '99.99',
      stock_quantity: 10,
      category_id: 1,
      brand: 'TestBrand',
      model: 'TestModel',
      image_urls: ['http://example.com/image.jpg'],
      specifications: { color: 'black' },
      is_featured: false
    }).execute();

    // Add item to wishlist first
    await db.insert(wishlistItemsTable).values({
      user_id: 1,
      product_id: 1
    }).execute();

    // Verify item exists in wishlist
    const beforeRemoval = await db.select()
      .from(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.user_id, 1),
          eq(wishlistItemsTable.product_id, 1)
        )
      )
      .execute();

    expect(beforeRemoval).toHaveLength(1);

    // Remove item from wishlist
    await removeFromWishlist(testInput);

    // Verify item is removed from wishlist
    const afterRemoval = await db.select()
      .from(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.user_id, 1),
          eq(wishlistItemsTable.product_id, 1)
        )
      )
      .execute();

    expect(afterRemoval).toHaveLength(0);
  });

  it('should not affect other wishlist items', async () => {
    // Create test user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User'
    }).execute();

    // Create test category
    await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).execute();

    // Create two test products
    await db.insert(productsTable).values([
      {
        name: 'Product 1',
        description: 'First product',
        price: '99.99',
        stock_quantity: 10,
        category_id: 1,
        brand: 'TestBrand',
        model: 'Model1',
        image_urls: ['http://example.com/image1.jpg'],
        specifications: { color: 'black' },
        is_featured: false
      },
      {
        name: 'Product 2',
        description: 'Second product',
        price: '149.99',
        stock_quantity: 5,
        category_id: 1,
        brand: 'TestBrand',
        model: 'Model2',
        image_urls: ['http://example.com/image2.jpg'],
        specifications: { color: 'white' },
        is_featured: false
      }
    ]).execute();

    // Add both products to wishlist
    await db.insert(wishlistItemsTable).values([
      { user_id: 1, product_id: 1 },
      { user_id: 1, product_id: 2 }
    ]).execute();

    // Remove only the first product
    await removeFromWishlist({ user_id: 1, product_id: 1 });

    // Verify only the first item is removed
    const remainingItems = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.user_id, 1))
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].product_id).toBe(2);
  });

  it('should handle non-existent wishlist item gracefully', async () => {
    // Create test user and product but don't add to wishlist
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User'
    }).execute();

    await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).execute();

    await db.insert(productsTable).values({
      name: 'Test Product',
      description: 'A test product',
      price: '99.99',
      stock_quantity: 10,
      category_id: 1,
      brand: 'TestBrand',
      model: 'TestModel',
      image_urls: ['http://example.com/image.jpg'],
      specifications: { color: 'black' },
      is_featured: false
    }).execute();

    // Try to remove item that doesn't exist in wishlist
    await expect(removeFromWishlist(testInput)).resolves.toBeUndefined();

    // Verify no items exist in wishlist
    const items = await db.select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.user_id, 1))
      .execute();

    expect(items).toHaveLength(0);
  });
});
