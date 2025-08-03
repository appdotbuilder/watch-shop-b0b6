
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCategoryInput = {
  name: 'Luxury Watches',
  description: 'Premium timepieces for discerning customers',
  image_url: 'https://example.com/luxury-watches.jpg'
};

// Test input with minimal fields (nullables omitted)
const minimalInput: CreateCategoryInput = {
  name: 'Sports Watches'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Luxury Watches');
    expect(result.description).toEqual('Premium timepieces for discerning customers');
    expect(result.image_url).toEqual('https://example.com/luxury-watches.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with only required fields', async () => {
    const result = await createCategory(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Sports Watches');
    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Luxury Watches');
    expect(categories[0].description).toEqual('Premium timepieces for discerning customers');
    expect(categories[0].image_url).toEqual('https://example.com/luxury-watches.jpg');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique constraint violation', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create duplicate category with same name
    const duplicateInput: CreateCategoryInput = {
      name: 'Luxury Watches',
      description: 'Different description',
      image_url: 'https://example.com/different-image.jpg'
    };

    await expect(createCategory(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple categories with different names', async () => {
    const category1 = await createCategory(testInput);
    const category2 = await createCategory(minimalInput);

    // Verify both categories exist in database
    const categories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(categories).toHaveLength(2);
    expect(categories.map(c => c.name)).toContainEqual('Luxury Watches');
    expect(categories.map(c => c.name)).toContainEqual('Sports Watches');
  });
});
