
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, categoriesTable, reviewsTable } from '../db/schema';
import { getProductReviews } from '../handlers/get_product_reviews';

describe('getProductReviews', () => {
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
        last_name: 'User',
        is_admin: false
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create test product
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
        is_featured: false
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  it('should return empty array when no reviews exist', async () => {
    const reviews = await getProductReviews(testProductId);
    
    expect(reviews).toEqual([]);
  });

  it('should return reviews for a specific product', async () => {
    // Create test reviews
    await db.insert(reviewsTable)
      .values([
        {
          user_id: testUserId,
          product_id: testProductId,
          rating: 5,
          comment: 'Excellent product!'
        },
        {
          user_id: testUserId,
          product_id: testProductId,
          rating: 4,
          comment: 'Good quality'
        }
      ])
      .execute();

    const reviews = await getProductReviews(testProductId);

    expect(reviews).toHaveLength(2);
    expect(reviews[0].product_id).toEqual(testProductId);
    expect(reviews[0].user_id).toEqual(testUserId);
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].comment).toEqual('Excellent product!');
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].id).toBeDefined();

    expect(reviews[1].rating).toEqual(4);
    expect(reviews[1].comment).toEqual('Good quality');
  });

  it('should only return reviews for the specified product', async () => {
    // Create another product
    const categoryResult = await db.select().from(categoriesTable).limit(1).execute();
    const otherProductResult = await db.insert(productsTable)
      .values({
        name: 'Other Product',
        description: 'Another test product',
        price: '49.99',
        stock_quantity: 5,
        category_id: categoryResult[0].id,
        brand: 'OtherBrand',
        model: 'OtherModel',
        image_urls: ['http://example.com/other.jpg'],
        is_featured: false
      })
      .returning()
      .execute();

    // Create reviews for both products
    await db.insert(reviewsTable)
      .values([
        {
          user_id: testUserId,
          product_id: testProductId,
          rating: 5,
          comment: 'Great!'
        },
        {
          user_id: testUserId,
          product_id: otherProductResult[0].id,
          rating: 3,
          comment: 'Okay product'
        }
      ])
      .execute();

    const reviews = await getProductReviews(testProductId);

    expect(reviews).toHaveLength(1);
    expect(reviews[0].product_id).toEqual(testProductId);
    expect(reviews[0].comment).toEqual('Great!');
  });

  it('should handle reviews with null comments', async () => {
    await db.insert(reviewsTable)
      .values({
        user_id: testUserId,
        product_id: testProductId,
        rating: 4,
        comment: null
      })
      .execute();

    const reviews = await getProductReviews(testProductId);

    expect(reviews).toHaveLength(1);
    expect(reviews[0].comment).toBeNull();
    expect(reviews[0].rating).toEqual(4);
  });
});
