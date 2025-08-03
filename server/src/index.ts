
import { initTRPC } from '@trpc/server';
import { createHTTPServer }  from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginInputSchema,
  createCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  getProductsInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  createReviewInputSchema,
  addToWishlistInputSchema,
  removeFromWishlistInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { getCategories } from './handlers/get_categories';
import { createCategory } from './handlers/create_category';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { createProduct } from './handlers/create_product';
import { updateProduct } from './handlers/update_product';
import { addToCart } from './handlers/add_to_cart';
import { getCartItems } from './handlers/get_cart_items';
import { updateCartItem } from './handlers/update_cart_item';
import { removeFromCart } from './handlers/remove_from_cart';
import { createOrder } from './handlers/create_order';
import { getUserOrders } from './handlers/get_user_orders';
import { getAllOrders } from './handlers/get_all_orders';
import { updateOrderStatus } from './handlers/update_order_status';
import { createReview } from './handlers/create_review';
import { getProductReviews } from './handlers/get_product_reviews';
import { addToWishlist } from './handlers/add_to_wishlist';
import { getWishlistItems } from './handlers/get_wishlist_items';
import { removeFromWishlist } from './handlers/remove_from_wishlist';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
  
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Category routes
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  // Product routes
  getProducts: publicProcedure
    .input(getProductsInputSchema.optional())
    .query(({ input }) => getProducts(input)),
  
  getProductById: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductById(input)),
  
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Cart routes
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),
  
  getCartItems: publicProcedure
    .input(z.number())
    .query(({ input }) => getCartItems(input)),
  
  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),
  
  removeFromCart: publicProcedure
    .input(z.number())
    .mutation(({ input }) => removeFromCart(input)),

  // Order routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),
  
  getUserOrders: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserOrders(input)),
  
  getAllOrders: publicProcedure
    .query(() => getAllOrders()),
  
  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),

  // Review routes
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  
  getProductReviews: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductReviews(input)),

  // Wishlist routes
  addToWishlist: publicProcedure
    .input(addToWishlistInputSchema)
    .mutation(({ input }) => addToWishlist(input)),
  
  getWishlistItems: publicProcedure
    .input(z.number())
    .query(({ input }) => getWishlistItems(input)),
  
  removeFromWishlist: publicProcedure
    .input(removeFromWishlistInputSchema)
    .mutation(({ input }) => removeFromWishlist(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
