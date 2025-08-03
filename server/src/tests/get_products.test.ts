
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { type GetProductsInput, type CreateCategoryInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test data setup
const testCategory: CreateCategoryInput = {
  name: 'Luxury Watches',
  description: 'Premium timepieces',
  image_url: 'https://example.com/watches.jpg'
};

const createTestProducts = async () => {
  // Create category first
  const categoryResult = await db.insert(categoriesTable)
    .values({
      name: testCategory.name,
      description: testCategory.description,
      image_url: testCategory.image_url
    })
    .returning()
    .execute();

  const categoryId = categoryResult[0].id;

  // Create test products one by one to avoid type issues
  await db.insert(productsTable).values({
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
  }).execute();

  await db.insert(productsTable).values({
    name: 'Omega Speedmaster',
    description: 'Moon watch professional',
    price: '6200.00',
    stock_quantity: 10,
    category_id: categoryId,
    brand: 'Omega',
    model: 'Speedmaster',
    image_urls: ['https://example.com/omega1.jpg'],
    specifications: { 'Movement': 'Manual', 'Case Size': '42mm' },
    is_featured: false
  }).execute();

  await db.insert(productsTable).values({
    name: 'TAG Heuer Formula 1',
    description: 'Sports chronograph',
    price: '1200.00',
    stock_quantity: 15,
    category_id: categoryId,
    brand: 'TAG Heuer',
    model: 'Formula 1',
    image_urls: ['https://example.com/tag1.jpg'],
    specifications: { 'Movement': 'Quartz', 'Water Resistance': '200m' },
    is_featured: true
  }).execute();

  return categoryId;
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all products when no filters provided', async () => {
    await createTestProducts();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBeDefined();
    expect(typeof result[0].price).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter products by category', async () => {
    const categoryId = await createTestProducts();

    const input: GetProductsInput = {
      category_id: categoryId
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(3);
    result.forEach(product => {
      expect(product.category_id).toEqual(categoryId);
    });
  });

  it('should filter products by brand', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      brand: 'Rolex'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].brand).toEqual('Rolex');
    expect(result[0].name).toEqual('Rolex Submariner');
  });

  it('should filter products by price range', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      min_price: 2000,
      max_price: 7000
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Omega Speedmaster');
    expect(result[0].price).toEqual(6200);
    expect(result[0].price).toBeGreaterThanOrEqual(2000);
    expect(result[0].price).toBeLessThanOrEqual(7000);
  });

  it('should filter featured products', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      is_featured: true
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.is_featured).toBe(true);
    });
  });

  it('should search products by name', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      search: 'Rolex'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Rolex Submariner');
  });

  it('should search products by description', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      search: 'diving'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Rolex Submariner');
  });

  it('should apply pagination correctly', async () => {
    await createTestProducts();

    const inputPage1: GetProductsInput = {
      limit: 2,
      offset: 0
    };

    const resultPage1 = await getProducts(inputPage1);
    expect(resultPage1).toHaveLength(2);

    const inputPage2: GetProductsInput = {
      limit: 2,
      offset: 2
    };

    const resultPage2 = await getProducts(inputPage2);
    expect(resultPage2).toHaveLength(1);
  });

  it('should combine multiple filters', async () => {
    const categoryId = await createTestProducts();

    const input: GetProductsInput = {
      category_id: categoryId,
      is_featured: true,
      min_price: 1000,
      max_price: 10000
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.category_id).toEqual(categoryId);
      expect(product.is_featured).toBe(true);
      expect(product.price).toBeGreaterThanOrEqual(1000);
      expect(product.price).toBeLessThanOrEqual(10000);
    });
  });

  it('should return empty array when no products match filters', async () => {
    await createTestProducts();

    const input: GetProductsInput = {
      brand: 'Nonexistent Brand'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(0);
  });

  it('should ensure numeric fields are properly converted', async () => {
    await createTestProducts();

    const result = await getProducts();

    expect(result.length).toBeGreaterThan(0);
    result.forEach(product => {
      expect(typeof product.price).toBe('number');
      expect(typeof product.stock_quantity).toBe('number');
      expect(typeof product.category_id).toBe('number');
      expect(typeof product.id).toBe('number');
    });
  });

  it('should order products by creation date descending', async () => {
    await createTestProducts();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    // Results should be ordered by created_at desc (newest first)
    for (let i = 1; i < result.length; i++) {
      expect(result[i-1].created_at >= result[i].created_at).toBe(true);
    }
  });
});
