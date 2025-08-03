
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create order from cart items', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category',
        image_url: null
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'Test product 1',
        price: '100.00',
        stock_quantity: 10,
        category_id: category.id,
        brand: 'Brand A',
        model: 'Model 1',
        image_urls: ['http://example.com/image1.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();
    const product1 = product1Result[0];

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Test product 2',
        price: '50.00',
        stock_quantity: 5,
        category_id: category.id,
        brand: 'Brand B',
        model: 'Model 2',
        image_urls: ['http://example.com/image2.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();
    const product2 = product2Result[0];

    // Add items to cart
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: user.id,
          product_id: product1.id,
          quantity: 2
        },
        {
          user_id: user.id,
          product_id: product2.id,
          quantity: 1
        }
      ])
      .execute();

    const input: CreateOrderInput = {
      user_id: user.id,
      shipping_address: '123 Main St, City, State 12345',
      billing_address: '456 Oak Ave, City, State 12345'
    };

    const result = await createOrder(input);

    // Verify order fields
    expect(result.user_id).toEqual(user.id);
    expect(result.total_amount).toEqual(250.00); // 2 * 100 + 1 * 50
    expect(result.status).toEqual('pending');
    expect(result.shipping_address).toEqual(input.shipping_address);
    expect(result.billing_address).toEqual(input.billing_address);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create order items and clear cart', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category',
        image_url: null
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '75.50',
        stock_quantity: 10,
        category_id: category.id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 3
      })
      .execute();

    const input: CreateOrderInput = {
      user_id: user.id,
      shipping_address: '123 Main St',
      billing_address: '456 Oak Ave'
    };

    const result = await createOrder(input);

    // Verify order items were created
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].product_id).toEqual(product.id);
    expect(orderItems[0].quantity).toEqual(3);
    expect(parseFloat(orderItems[0].price_at_time)).toEqual(75.50);

    // Verify cart was cleared
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();

    expect(cartItems).toHaveLength(0);
  });

  it('should update product stock quantities', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category',
        image_url: null
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product with initial stock
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '25.00',
        stock_quantity: 8,
        category_id: category.id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 3
      })
      .execute();

    const input: CreateOrderInput = {
      user_id: user.id,
      shipping_address: '123 Main St',
      billing_address: '456 Oak Ave'
    };

    await createOrder(input);

    // Verify stock was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProduct[0].stock_quantity).toEqual(5); // 8 - 3
  });

  it('should throw error for empty cart', async () => {
    // Create user without cart items
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: CreateOrderInput = {
      user_id: user.id,
      shipping_address: '123 Main St',
      billing_address: '456 Oak Ave'
    };

    await expect(createOrder(input)).rejects.toThrow(/cart is empty/i);
  });

  it('should throw error for insufficient stock', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        phone: null,
        is_admin: false
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category',
        image_url: null
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create product with limited stock
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '50.00',
        stock_quantity: 2,
        category_id: category.id,
        brand: 'Test Brand',
        model: 'Test Model',
        image_urls: ['http://example.com/image.jpg'],
        specifications: null,
        is_featured: false
      })
      .returning()
      .execute();
    const product = productResult[0];

    // Add more items to cart than available in stock
    await db.insert(cartItemsTable)
      .values({
        user_id: user.id,
        product_id: product.id,
        quantity: 5
      })
      .execute();

    const input: CreateOrderInput = {
      user_id: user.id,
      shipping_address: '123 Main St',
      billing_address: '456 Oak Ave'
    };

    await expect(createOrder(input)).rejects.toThrow(/insufficient stock/i);
  });
});
