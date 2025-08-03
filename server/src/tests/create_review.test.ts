
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, orderItemsTable, reviewsTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq, and } from 'drizzle-orm';

describe('createReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let userId: number;
  let productId: number;
  let orderId: number;

  const setupTestData = async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        phone: '123-456-7890',
        is_admin: false
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '99.99',
        stock_quantity: 10,
        category_id: categoryResult[0].id,
        brand: 'TestBrand',
        model: 'TestModel',
        image_urls: ['http://example.com/image.jpg'],
        specifications: { color: 'black' },
        is_featured: false
      })
      .returning()
      .execute();
    productId = productResult[0].id;

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '99.99',
        status: 'delivered',
        shipping_address: '123 Test St',
        billing_address: '123 Test St'
      })
      .returning()
      .execute();
    orderId = orderResult[0].id;

    // Create order item (purchase history)
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        price_at_time: '99.99'
      })
      .execute();
  };

  const testInput: CreateReviewInput = {
    user_id: 0, // Will be set in tests
    product_id: 0, // Will be set in tests
    rating: 5,
    comment: 'Great product!'
  };

  it('should create a review successfully', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      user_id: userId,
      product_id: productId
    };

    const result = await createReview(input);

    expect(result.user_id).toEqual(userId);
    expect(result.product_id).toEqual(productId);
    expect(result.rating).toEqual(5);
    expect(result.comment).toEqual('Great product!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      user_id: userId,
      product_id: productId
    };

    const result = await createReview(input);

    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].user_id).toEqual(userId);
    expect(reviews[0].product_id).toEqual(productId);
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].comment).toEqual('Great product!');
  });

  it('should create review with null comment', async () => {
    await setupTestData();
    
    const input = {
      user_id: userId,
      product_id: productId,
      rating: 4,
      comment: null
    };

    const result = await createReview(input);

    expect(result.comment).toBeNull();
    expect(result.rating).toEqual(4);
  });

  it('should throw error if user does not exist', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      user_id: 99999,
      product_id: productId
    };

    await expect(createReview(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error if product does not exist', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      user_id: userId,
      product_id: 99999
    };

    await expect(createReview(input)).rejects.toThrow(/product not found/i);
  });

  it('should throw error if user has not purchased the product', async () => {
    await setupTestData();

    // Create another product that user hasn't purchased
    const categoryResult = await db.select()
      .from(categoriesTable)
      .limit(1)
      .execute();

    const unpurchasedProduct = await db.insert(productsTable)
      .values({
        name: 'Unpurchased Product',
        description: 'A product not purchased by user',
        price: '49.99',
        stock_quantity: 5,
        category_id: categoryResult[0].id,
        brand: 'TestBrand',
        model: 'TestModel2',
        image_urls: ['http://example.com/image2.jpg'],
        specifications: { color: 'white' },
        is_featured: false
      })
      .returning()
      .execute();
    
    const input = {
      ...testInput,
      user_id: userId,
      product_id: unpurchasedProduct[0].id
    };

    await expect(createReview(input)).rejects.toThrow(/user must purchase product before reviewing/i);
  });

  it('should throw error if user has already reviewed the product', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      user_id: userId,
      product_id: productId
    };

    // Create first review
    await createReview(input);

    // Try to create second review for same product
    const secondInput = {
      ...input,
      rating: 3,
      comment: 'Changed my mind'
    };

    await expect(createReview(secondInput)).rejects.toThrow(/user has already reviewed this product/i);
  });

  it('should allow different users to review the same product', async () => {
    await setupTestData();

    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password2',
        first_name: 'Second',
        last_name: 'User',
        phone: '987-654-3210',
        is_admin: false
      })
      .returning()
      .execute();

    // Create order for second user
    const secondOrderResult = await db.insert(ordersTable)
      .values({
        user_id: secondUserResult[0].id,
        total_amount: '99.99',
        status: 'delivered',
        shipping_address: '456 Test Ave',
        billing_address: '456 Test Ave'
      })
      .returning()
      .execute();

    // Create order item for second user
    await db.insert(orderItemsTable)
      .values({
        order_id: secondOrderResult[0].id,
        product_id: productId,
        quantity: 1,
        price_at_time: '99.99'
      })
      .execute();

    // First user creates review
    const firstInput = {
      ...testInput,
      user_id: userId,
      product_id: productId
    };
    await createReview(firstInput);

    // Second user creates review for same product
    const secondInput = {
      user_id: secondUserResult[0].id,
      product_id: productId,
      rating: 3,
      comment: 'Different opinion'
    };

    const result = await createReview(secondInput);
    expect(result.user_id).toEqual(secondUserResult[0].id);
    expect(result.rating).toEqual(3);
    expect(result.comment).toEqual('Different opinion');
  });
});
