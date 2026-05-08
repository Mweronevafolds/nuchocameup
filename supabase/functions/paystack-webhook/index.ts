// @ts-ignore: Deno types for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Supabase JS library for Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface PaystackWebhookEvent {
    event: string;
    data: {
        id: number;
        reference: string;
        amount: number;
        paid_at: string;
        channel: string;
        status: string;
        customer: {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            phone: string;
        };
    };
}

// Paystack configuration
// @ts-ignore: Deno global available in Supabase Edge Functions
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Verify Paystack webhook signature
function verifyWebhookSignature(
    hash: string,
    body: string,
    secret: string
): boolean {
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();

    // This should be done using HMAC-SHA512
    // For now, we'll do a simple verification
    const hmacKey = encoder.encode(secret);
    const message = encoder.encode(body);

    // Note: In production, use proper HMAC verification
    console.log("Webhook hash:", hash);
    return true; // Simplified for now
}

// Update order status in Supabase
async function updateOrderStatus(
    reference: string,
    paymentStatus: string,
        transactionData: PaystackWebhookEvent["data"],
        supabaseUrl?: string,
        supabaseKey?: string
) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Supabase credentials not configured");
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Extract order ID from reference
        const orderId = reference.split("_")[0];

        const { data, error } = await supabase
            .from("orders")
            .update({
                payment_status: paymentStatus,
                paystack_reference: reference,
                paystack_transaction_id: transactionData.id.toString(),
                                order_status: paymentStatus === "completed" ? "processing" : "cancelled",
            })
            .eq("id", orderId)
            .select()
            .single();

        if (error) {
            console.error("Error updating order:", error);
            return;
        }

        console.log("Order updated:", data);

                // Trigger notification
                if (paymentStatus === "completed" && data) {
                    try {
                        const { data: orderItems } = await supabase
                            .from("order_items")
                            .select("product_name, quantity, size")
                            .eq("order_id", orderId);

                        await fetch(`${SUPABASE_URL}/functions/v1/order-notify`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            },
                            body: JSON.stringify({
                                orderId,
                                customerEmail: data.email,
                                customerPhone: data.phone_number,
                                orderStatus: "processing",
                                items: orderItems || [],
                            }),
                        });
                    } catch (notifyErr) {
                        console.warn("Order notification trigger failed:", notifyErr);
                    }
                }
    } catch (error) {
        console.error("Failed to update order:", error);
    }
}

// Handle webhook events
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-paystack-signature, Authorization",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const hash = req.headers.get("x-paystack-signature") || "";
        const body = await req.text();

        // Verify webhook signature
        // const isValid = verifyWebhookSignature(hash, body, PAYSTACK_SECRET_KEY);
        // if (!isValid) {
        //   return new Response(JSON.stringify({ error: "Invalid signature" }), {
        //     status: 401,
        //     headers: { "Content-Type": "application/json" },
        //   });
        // }

        const event: PaystackWebhookEvent = JSON.parse(body);

        console.log("Webhook event:", event.event);

        // Handle different event types
        switch (event.event) {
            case "charge.success":
                await updateOrderStatus(
                    event.data.reference,
                    "completed",
                    event.data
                );
                console.log("Payment successful:", event.data.reference);
                break;

            case "charge.failed":
                await updateOrderStatus(
                    event.data.reference,
                    "failed",
                    event.data
                );
                console.log("Payment failed:", event.data.reference);
                break;

            default:
                console.log("Unhandled event:", event.event);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(
            JSON.stringify({
                error: "Webhook processing failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
