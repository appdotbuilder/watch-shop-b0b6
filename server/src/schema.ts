
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable().optional()
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  category_id: z.number(),
  brand: z.string(),
  model: z.string(),
  image_urls: z.array(z.string()),
  specifications: z.record(z.string()).nullable(),
  is_featured: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  category_id: z.number(),
  brand: z.string().min(1),
  model: z.string().min(1),
  image_urls: z.array(z.string().url()),
  specifications: z.record(z.string()).nullable().optional(),
  is_featured: z.boolean().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  category_id: z.number().optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  image_urls: z.array(z.string().url()).optional(),
  specifications: z.record(z.string()).nullable().optional(),
  is_featured: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const getProductsInputSchema = z.object({
  category_id: z.number().optional(),
  search: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  brand: z.string().optional(),
  is_featured: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetProductsInput = z.infer<typeof getProductsInputSchema>;

// Cart schemas
export const cartItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  added_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const addToCartInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Order schemas
export const orderStatusEnum = z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_amount: z.number(),
  status: orderStatusEnum,
  shipping_address: z.string(),
  billing_address: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  price_at_time: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderInputSchema = z.object({
  user_id: z.number(),
  shipping_address: z.string().min(1),
  billing_address: z.string().min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: orderStatusEnum
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// Review schemas
export const reviewSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

export const createReviewInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional()
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Wishlist schemas
export const wishlistItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  added_at: z.coerce.date()
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const addToWishlistInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number()
});

export type AddToWishlistInput = z.infer<typeof addToWishlistInputSchema>;

export const removeFromWishlistInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number()
});

export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistInputSchema>;
