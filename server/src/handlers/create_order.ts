
import { db } from '../db';
import { cartItemsTable, ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // Get cart items with product details
    const cartItems = await db.select({
      id: cartItemsTable.id,
      product_id: cartItemsTable.product_id,
      quantity: cartItemsTable.quantity,
      price: productsTable.price,
      stock_quantity: productsTable.stock_quantity
    })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate stock availability and calculate total
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: input.user_id,
        total_amount: totalAmount.toString(),
        status: 'pending',
        shipping_address: input.shipping_address,
        billing_address: input.billing_address
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsData = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_time: item.price
    }));

    await db.insert(orderItemsTable)
      .values(orderItemsData)
      .execute();

    // Update product stock quantities
    for (const item of cartItems) {
      await db.update(productsTable)
        .set({
          stock_quantity: item.stock_quantity - item.quantity
        })
        .where(eq(productsTable.id, item.product_id))
        .execute();
    }

    // Clear user's cart
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    // Return order with converted numeric fields
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};
