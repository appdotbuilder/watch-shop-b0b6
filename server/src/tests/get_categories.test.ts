
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable).values([
      {
        name: 'Luxury Watches',
        description: 'Premium and luxury timepieces',
        image_url: 'https://example.com/luxury.jpg'
      },
      {
        name: 'Sport Watches',
        description: 'Durable watches for active lifestyles',
        image_url: 'https://example.com/sport.jpg'
      },
      {
        name: 'Smart Watches',
        description: null,
        image_url: null
      }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check first category
    expect(result[0].name).toEqual('Luxury Watches');
    expect(result[0].description).toEqual('Premium and luxury timepieces');
    expect(result[0].image_url).toEqual('https://example.com/luxury.jpg');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second category
    expect(result[1].name).toEqual('Sport Watches');
    expect(result[1].description).toEqual('Durable watches for active lifestyles');
    expect(result[1].image_url).toEqual('https://example.com/sport.jpg');

    // Check third category with null fields
    expect(result[2].name).toEqual('Smart Watches');
    expect(result[2].description).toBeNull();
    expect(result[2].image_url).toBeNull();
  });

  it('should return categories in creation order', async () => {
    // Create categories with slight delay to ensure different timestamps
    await db.insert(categoriesTable).values({
      name: 'First Category',
      description: 'Created first'
    }).execute();

    await db.insert(categoriesTable).values({
      name: 'Second Category',
      description: 'Created second'
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
