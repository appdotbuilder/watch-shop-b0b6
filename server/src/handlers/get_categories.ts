
import { type Category } from '../schema';

export const getCategories = async (): Promise<Category[]> => {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch all watch categories from the database
  // for use in navigation and product filtering.
  return Promise.resolve([
    {
      id: 1,
      name: 'Luxury Watches',
      description: 'Premium and luxury timepieces',
      image_url: 'https://example.com/luxury.jpg',
      created_at: new Date()
    },
    {
      id: 2,
      name: 'Sport Watches',
      description: 'Durable watches for active lifestyles',
      image_url: 'https://example.com/sport.jpg',
      created_at: new Date()
    }
  ] as Category[]);
};
