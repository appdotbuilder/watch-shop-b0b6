
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product by ID', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Watches',
        description: 'Luxury timepieces'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Rolex Submariner',
        description: 'Classic diving watch',
        price: '8500.00',
        stock_quantity: 5,
        category_id: categoryId,
        brand: 'Rolex',
        model: 'Submariner',
        image_urls: ['https://example.com/rolex1.jpg'],
        specifications: { 'Water Resistance': '300m', 'Movement': 'Automatic' },
        is_featured: true
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test retrieval
    const result = await getProductById(productId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('Rolex Submariner');
    expect(result!.description).toEqual('Classic diving watch');
    expect(result!.price).toEqual(8500.00);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock_quantity).toEqual(5);
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.brand).toEqual('Rolex');
    expect(result!.model).toEqual('Submariner');
    expect(result!.image_urls).toEqual(['https://example.com/rolex1.jpg']);
    expect(result!.specifications).toEqual({ 'Water Resistance': '300m', 'Movement': 'Automatic' });
    expect(result!.is_featured).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product', async () => {
    const result = await getProductById(999);
    expect(result).toBeNull();
  });

  it('should handle products with null optional fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with minimal required fields
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Basic Phone',
        price: '299.99',
        stock_quantity: 10,
        category_id: categoryId,
        brand: 'Generic',
        model: 'Basic-1',
        image_urls: ['https://example.com/phone.jpg'],
        is_featured: false
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    const result = await getProductById(productId);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.specifications).toBeNull();
    expect(result!.price).toEqual(299.99);
    expect(typeof result!.price).toEqual('number');
  });
});
