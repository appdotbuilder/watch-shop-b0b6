
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { getCartItems } from '../handlers/get_cart_items';

describe('getCartItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no cart items', async () => {
    // Create user
    const users = await db.insert(usersTable)
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

    const result = await getCartItems(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return cart items for user', async () => {
    // Create user
    const users = await db.insert(usersTable)
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

    // Create category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices',
        image_url: null
      })
      .returning()
      .execute();

    // Create product
    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: categories[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['https://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();

    // Create cart item
    const cartItems = await db.insert(cartItemsTable)
      .values({
        user_id: users[0].id,
        product_id: products[0].id,
        quantity: 2
      })
      .returning()
      .execute();

    const result = await getCartItems(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(cartItems[0].id);
    expect(result[0].user_id).toBe(users[0].id);
    expect(result[0].product_id).toBe(products[0].id);
    expect(result[0].quantity).toBe(2);
    expect(result[0].added_at).toBeInstanceOf(Date);
  });

  it('should return multiple cart items for user', async () => {
    // Create user
    const users = await db.insert(usersTable)
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

    // Create category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices',
        image_url: null
      })
      .returning()
      .execute();

    // Create products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'First product',
          price: '19.99',
          stock_quantity: 100,
          category_id: categories[0].id,
          brand: 'TestBrand',
          model: 'Model1',
          image_urls: ['https://example.com/image1.jpg'],
          specifications: null,
          is_featured: false
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: '29.99',
          stock_quantity: 50,
          category_id: categories[0].id,
          brand: 'TestBrand',
          model: 'Model2',
          image_urls: ['https://example.com/image2.jpg'],
          specifications: null,
          is_featured: true
        }
      ])
      .returning()
      .execute();

    // Create cart items
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: users[0].id,
          product_id: products[0].id,
          quantity: 2
        },
        {
          user_id: users[0].id,
          product_id: products[1].id,
          quantity: 1
        }
      ])
      .execute();

    const result = await getCartItems(users[0].id);

    expect(result).toHaveLength(2);
    expect(result.every(item => item.user_id === users[0].id)).toBe(true);
    expect(result.map(item => item.product_id).sort()).toEqual([products[0].id, products[1].id].sort());
    expect(result.every(item => item.added_at instanceof Date)).toBe(true);
  });

  it('should not return cart items for other users', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hashedpassword1',
          first_name: 'User',
          last_name: 'One',
          phone: null,
          is_admin: false
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashedpassword2',
          first_name: 'User',
          last_name: 'Two',
          phone: null,
          is_admin: false
        }
      ])
      .returning()
      .execute();

    // Create category and product
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices',
        image_url: null
      })
      .returning()
      .execute();

    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99',
        stock_quantity: 100,
        category_id: categories[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['https://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();

    // Create cart items for both users
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: users[0].id,
          product_id: products[0].id,
          quantity: 2
        },
        {
          user_id: users[1].id,
          product_id: products[0].id,
          quantity: 3
        }
      ])
      .execute();

    // Get cart items for first user
    const result = await getCartItems(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(users[0].id);
    expect(result[0].quantity).toBe(2);
  });
});
