/**
 * Seed script to generate test orders and analytics data
 * This creates realistic order and order_item data for testing the analytics dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export interface SeedOptions {
  daysBack?: number; // How many days of historical data to create
  ordersPerDay?: number; // Average orders per day
  products?: Array<{ id: string; name: string; price: number }>;
}

const DEFAULT_PRODUCTS = [
  { id: "prod-1", name: "Cropped Tee Black", price: 1500 },
  { id: "prod-2", name: "Crop Top Pink", price: 1800 },
  { id: "prod-3", name: "Hoodie Blue", price: 2500 },
  { id: "prod-4", name: "Cropped Hoodie", price: 2800 },
  { id: "prod-5", name: "Croptop Blue", price: 1800 },
];

/**
 * Generate random orders across multiple days
 */
export async function seedAnalyticsData(options: SeedOptions = {}) {
  const {
    daysBack = 30,
    ordersPerDay = 3,
    products = DEFAULT_PRODUCTS,
  } = options;

  try {
    console.log("🌱 Starting analytics data seed...");

    const orders = [];
    const orderItems = [];
    const paymentStatuses = ["completed", "pending", "failed"] as const;

    // Generate orders for the past N days
    for (let day = daysBack; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);

      const numOrders = Math.floor(Math.random() * ordersPerDay) + 1;

      for (let i = 0; i < numOrders; i++) {
        const orderId = `order-${Date.now()}-${day}-${i}`;
        const numItems = Math.floor(Math.random() * 3) + 1;
        let totalAmount = 0;

        // Create order items
        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const itemTotal = product.price * quantity;
          totalAmount += itemTotal;

          orderItems.push({
            order_id: orderId,
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            quantity,
            subtotal: itemTotal,
          });
        }

        // Bias towards completed orders (70% completed, 20% pending, 10% failed)
        const rand = Math.random();
        const payment_status = rand < 0.7 ? "completed" : rand < 0.9 ? "pending" : "failed";

        orders.push({
          id: orderId,
          user_id: `user-${Math.floor(Math.random() * 100)}`,
          total_amount: totalAmount,
          payment_status,
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
          customer_email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
          customer_name: `Customer ${Math.floor(Math.random() * 1000)}`,
          shipping_address: "Test Address",
          notes: null,
        });
      }
    }

    console.log(`📦 Generated ${orders.length} orders and ${orderItems.length} order items`);

    // Insert orders
    if (orders.length > 0) {
      const { error: orderError } = await supabase
        .from("orders")
        .insert(orders);

      if (orderError) {
        console.error("❌ Error inserting orders:", orderError);
        throw orderError;
      }
      console.log("✅ Orders inserted successfully");
    }

    // Insert order items
    if (orderItems.length > 0) {
      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) {
        console.error("❌ Error inserting order items:", itemError);
        throw itemError;
      }
      console.log("✅ Order items inserted successfully");
    }

    console.log("🎉 Analytics data seeding complete!");
    return { ordersCount: orders.length, itemsCount: orderItems.length };
  } catch (error) {
    console.error("💥 Seed failed:", error);
    throw error;
  }
}

/**
 * Clear all orders and order items (dangerous - use with caution)
 */
export async function clearAnalyticsData() {
  try {
    console.log("🗑️ Clearing analytics data...");

    // Delete in correct order (items first, then orders due to foreign keys)
    const { error: itemError } = await supabase
      .from("order_items")
      .delete()
      .neq("id", "");

    if (itemError) {
      console.error("❌ Error deleting order items:", itemError);
      throw itemError;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .neq("id", "");

    if (orderError) {
      console.error("❌ Error deleting orders:", orderError);
      throw orderError;
    }

    console.log("✅ All analytics data cleared");
  } catch (error) {
    console.error("💥 Clear failed:", error);
    throw error;
  }
}
