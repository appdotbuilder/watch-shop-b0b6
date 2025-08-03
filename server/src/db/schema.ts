
import { serial, text, pgTable, timestamp, numeric, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  is_admin: boolean('is_admin').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  image_urls: json('image_urls').$type<string[]>().notNull(),
  specifications: json('specifications').$type<Record<string, string>>(),
  is_featured: boolean('is_featured').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Cart items table
export const cartItemsTable = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  added_at: timestamp('added_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  shipping_address: text('shipping_address').notNull(),
  billing_address: text('billing_address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => ordersTable.id),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  price_at_time: numeric('price_at_time', { precision: 10, scale: 2 }).notNull(),
});

// Reviews table
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Wishlist items table
export const wishlistItemsTable = pgTable('wishlist_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  added_at: timestamp('added_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
  reviews: many(reviewsTable),
  wishlistItems: many(wishlistItemsTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.category_id],
    references: [categoriesTable.id],
  }),
  cartItems: many(cartItemsTable),
  orderItems: many(orderItemsTable),
  reviews: many(reviewsTable),
  wishlistItems: many(wishlistItemsTable),
}));

export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [cartItemsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [cartItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.user_id],
    references: [usersTable.id],
  }),
  orderItems: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [reviewsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [reviewsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [wishlistItemsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [wishlistItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  products: productsTable,
  cartItems: cartItemsTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  reviews: reviewsTable,
  wishlistItems: wishlistItemsTable,
};
