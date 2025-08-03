
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test category data
const testCategory = {
  name: 'Luxury Watches',
  description: 'Premium watch collection',
  image_url: 'https://example.com/category.jpg'
};

// Complete test input with all required fields
const testInput: CreateProductInput = {
  name: 'Rolex Submariner',
  description: 'Professional diving watch',
  price: 8500.00,
  stock_quantity: 5,
  category_id: 1, // Will be set after creating category
  brand: 'Rolex',
  model: 'Submariner Date',
  image_urls: ['https://example.com/rolex1.jpg', 'https://example.com/rolex2.jpg'],
  specifications: {
    'case_material': 'Stainless Steel',
    'movement': 'Automatic',
    'water_resistance': '300m'
  },
  is_featured: true
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    // Create prerequisite category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    const input = { ...testInput, category_id: categoryResult[0].id };
    const result = await createProduct(input);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Rolex Submariner');
    expect(result.description).toEqual('Professional diving watch');
    expect(result.price).toEqual(8500.00);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.stock_quantity).toEqual(5);
    expect(result.category_id).toEqual(categoryResult[0].id);
    expect(result.brand).toEqual('Rolex');
    expect(result.model).toEqual('Submariner Date');
    expect(result.image_urls).toEqual(['https://example.com/rolex1.jpg', 'https://example.com/rolex2.jpg']);
    expect(result.specifications).toEqual({
      'case_material': 'Stainless Steel',
      'movement': 'Automatic',
      'water_resistance': '300m'
    });
    expect(result.is_featured).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    const input = { ...testInput, category_id: categoryResult[0].id };
    const result = await createProduct(input);

    // Query database to verify data was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Rolex Submariner');
    expect(savedProduct.description).toEqual('Professional diving watch');
    expect(parseFloat(savedProduct.price)).toEqual(8500.00); // Database stores as string
    expect(savedProduct.stock_quantity).toEqual(5);
    expect(savedProduct.category_id).toEqual(categoryResult[0].id);
    expect(savedProduct.brand).toEqual('Rolex');
    expect(savedProduct.model).toEqual('Submariner Date');
    expect(savedProduct.image_urls).toEqual(['https://example.com/rolex1.jpg', 'https://example.com/rolex2.jpg']);
    expect(savedProduct.specifications).toEqual({
      'case_material': 'Stainless Steel',
      'movement': 'Automatic',
      'water_resistance': '300m'
    });
    expect(savedProduct.is_featured).toEqual(true);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    // Test input with minimal required fields only
    const minimalInput: CreateProductInput = {
      name: 'Basic Watch',
      price: 199.99,
      stock_quantity: 10,
      category_id: categoryResult[0].id,
      brand: 'Casio',
      model: 'F-91W',
      image_urls: ['https://example.com/casio.jpg']
    };

    const result = await createProduct(minimalInput);

    expect(result.name).toEqual('Basic Watch');
    expect(result.description).toBeNull();
    expect(result.specifications).toBeNull();
    expect(result.is_featured).toEqual(false); // Default value
  });

  it('should throw error for non-existent category', async () => {
    const input = { ...testInput, category_id: 999 };

    await expect(createProduct(input)).rejects.toThrow(/Category with id 999 does not exist/i);
  });
});
