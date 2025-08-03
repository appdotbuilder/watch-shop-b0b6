
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, wishlistItemsTable } from '../db/schema';
import { getWishlistItems } from '../handlers/get_wishlist_items';

describe('getWishlistItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no wishlist items', async () => {
    // Create user but no wishlist items
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

    const result = await getWishlistItems(userResult[0].id);

    expect(result).toEqual([]);
  });

  it('should return wishlist items for user', async () => {
    // Create user
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

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products',
        image_url: null
      })
      .returning()
      .execute();

    // Create products
    const productResult1 = await db.insert(productsTable)
      .values({
        name: 'iPhone 15',
        description: 'Latest iPhone',
        price: '999.00',
        stock_quantity: 10,
        category_id: categoryResult[0].id,
        brand: 'Apple',
        model: 'iPhone 15',
        image_urls: ['https://example.com/iphone.jpg'],
        specifications: { color: 'Black', storage: '128GB' },
        is_featured: true
      })
      .returning()
      .execute();

    const productResult2 = await db.insert(productsTable)
      .values({
        name: 'MacBook Pro',
        description: 'Professional laptop',
        price: '1999.00',
        stock_quantity: 5,
        category_id: categoryResult[0].id,
        brand: 'Apple',
        model: 'MacBook Pro',
        image_urls: ['https://example.com/macbook.jpg'],
        specifications: { color: 'Silver', memory: '16GB' },
        is_featured: false
      })
      .returning()
      .execute();

    // Add items to wishlist
    const wishlistResult = await db.insert(wishlistItemsTable)
      .values([
        {
          user_id: userResult[0].id,
          product_id: productResult1[0].id
        },
        {
          user_id: userResult[0].id,
          product_id: productResult2[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getWishlistItems(userResult[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userResult[0].id);
    expect(result[0].product_id).toEqual(productResult1[0].id);
    expect(result[0].added_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].user_id).toEqual(userResult[0].id);
    expect(result[1].product_id).toEqual(productResult2[0].id);
    expect(result[1].added_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should only return items for specified user', async () => {
    // Create two users
    const userResult1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    const userResult2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();

    // Create category and product
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
        name: 'iPhone 15',
        description: 'Latest iPhone',
        price: '999.00',
        stock_quantity: 10,
        category_id: categoryResult[0].id,
        brand: 'Apple',
        model: 'iPhone 15',
        image_urls: ['https://example.com/iphone.jpg'],
        specifications: { color: 'Black', storage: '128GB' },
        is_featured: true
      })
      .returning()
      .execute();

    // Add items to wishlist for both users
    await db.insert(wishlistItemsTable)
      .values([
        {
          user_id: userResult1[0].id,
          product_id: productResult[0].id
        },
        {
          user_id: userResult2[0].id,
          product_id: productResult[0].id
        }
      ])
      .execute();

    // Get wishlist for user 1
    const result = await getWishlistItems(userResult1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userResult1[0].id);
    expect(result[0].product_id).toEqual(productResult[0].id);
  });
});
