
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let productId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        description: 'Original description',
        price: '99.99',
        stock_quantity: 50,
        category_id: categoryId,
        brand: 'Original Brand',
        model: 'Original Model',
        image_urls: ['http://example.com/image1.jpg'],
        specifications: { color: 'red' },
        is_featured: false
      })
      .returning()
      .execute();
    productId = productResult[0].id;
  });

  it('should update product name', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(input);

    expect(result.id).toEqual(productId);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.description).toEqual('Original description');
    expect(result.brand).toEqual('Original Brand');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Updated Name',
      price: 149.99,
      stock_quantity: 75,
      is_featured: true
    };

    const result = await updateProduct(input);

    expect(result.name).toEqual('Updated Name');
    expect(result.price).toEqual(149.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(75);
    expect(result.is_featured).toEqual(true);
    expect(result.brand).toEqual('Original Brand'); // unchanged
  });

  it('should update nullable fields', async () => {
    const input: UpdateProductInput = {
      id: productId,
      description: null,
      specifications: null
    };

    const result = await updateProduct(input);

    expect(result.description).toBeNull();
    expect(result.specifications).toBeNull();
  });

  it('should save updates to database', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Database Updated Name',
      price: 199.99
    };

    await updateProduct(input);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Name');
    expect(parseFloat(products[0].price)).toEqual(199.99);
  });

  it('should update category_id when valid category provided', async () => {
    // Create another category
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        description: 'Another category'
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const input: UpdateProductInput = {
      id: productId,
      category_id: newCategoryId
    };

    const result = await updateProduct(input);

    expect(result.category_id).toEqual(newCategoryId);
  });

  it('should throw error when product not found', async () => {
    const input: UpdateProductInput = {
      id: 999999,
      name: 'Should not work'
    };

    await expect(updateProduct(input)).rejects.toThrow(/product not found/i);
  });

  it('should throw error when category_id is invalid', async () => {
    const input: UpdateProductInput = {
      id: productId,
      category_id: 999999
    };

    await expect(updateProduct(input)).rejects.toThrow(/category not found/i);
  });

  it('should update image_urls array', async () => {
    const newImageUrls = [
      'http://example.com/new1.jpg',
      'http://example.com/new2.jpg'
    ];

    const input: UpdateProductInput = {
      id: productId,
      image_urls: newImageUrls
    };

    const result = await updateProduct(input);

    expect(result.image_urls).toEqual(newImageUrls);
    expect(result.image_urls).toHaveLength(2);
  });

  it('should update specifications object', async () => {
    const newSpecs = {
      color: 'blue',
      size: 'large',
      weight: '2kg'
    };

    const input: UpdateProductInput = {
      id: productId,
      specifications: newSpecs
    };

    const result = await updateProduct(input);

    expect(result.specifications).toEqual(newSpecs);
  });
});
