import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/validations/schemas";

export interface CheckoutOrder extends Order {
    id: string;
    paystack_reference?: string;
    authorization_url?: string;
    paystack_initiated_at?: string;
}

export function useCheckout() {
    const { items, closeCart } = useCart();
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: async (orderData: Order): Promise<CheckoutOrder> => {
            // 1. Create order in Supabase
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    phone_number: orderData.phoneNumber,
                    email: orderData.email,
                    shipping_address: orderData.shippingAddress,
                    total_amount: orderData.totalAmount,
                    currency: orderData.currency,
                    payment_method: orderData.paymentMethod,
                    payment_status: "pending",
                    order_status: "pending",
                    delivery_method: orderData.deliveryMethod,
                    pickup_point_id: orderData.pickupPointId,
                    notes: orderData.notes,
                })
                .select()
                .single();

            if (orderError) {
                console.error("Order creation error:", orderError);
                if (orderError.code === "PGRST116") {
                    throw new Error(
                        "Orders table not found. Please apply Supabase migrations. Run: supabase migration up"
                    );
                }
                throw new Error(
                    orderError.message || "Failed to create order. Please try again."
                );
            }

            // 2. Create order items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.product.id,
                product_name: item.product.name,
                product_price: item.product.price,
                size: item.size,
                quantity: item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) {
                // Rollback order if items insert fails
                await supabase.from("orders").delete().eq("id", order.id);
                throw new Error("Failed to create order items");
            }

            // 3. Initialize Paystack payment
            try {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const response = await fetch(`${supabaseUrl}/functions/v1/paystack-initialize`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: orderData.email,
                        amount: orderData.totalAmount,
                        orderId: order.id,
                        metadata: {
                            order_id: order.id,
                            customer_name: orderData.shippingAddress.fullName,
                            customer_email: orderData.email,
                            customer_phone: orderData.phoneNumber,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to initialize Paystack payment");
                }

                const paystackResponse = await response.json();

                if (!paystackResponse.status || !paystackResponse.data) {
                    throw new Error(paystackResponse.message || "Invalid Paystack response");
                }

                // Update order with Paystack details
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({
                        paystack_reference: paystackResponse.data.reference,
                    })
                    .eq("id", order.id);

                if (updateError) {
                    console.warn("Failed to update order with Paystack reference:", updateError);
                }

                        // Trigger order notification (email/SMS)
                        try {
                            const orderItems = items.map((item) => ({
                                product_name: item.product.name,
                                quantity: item.quantity,
                                size: item.size,
                            }));

                            await supabase.functions.invoke("order-notify", {
                                body: {
                                    orderId: order.id,
                                    customerEmail: orderData.email,
                                    customerPhone: orderData.phoneNumber,
                                    orderStatus: "confirmed",
                                    items: orderItems,
                                },
                            });
                        } catch (notifyErr) {
                            console.warn("Order notification failed:", notifyErr);
                        }

                toast({
                    title: "Payment Ready",
                    description: "Redirecting to Paystack to complete your payment...",
                });

                return {
                    ...order,
                    ...orderData,
                    paystack_reference: paystackResponse.data.reference,
                    authorization_url: paystackResponse.data.authorization_url,
                };
            } catch (paystackError) {
                const errorMessage = paystackError instanceof Error ? paystackError.message : String(paystackError);

                // Check if error is due to missing Paystack configuration
                if (
                    errorMessage.includes("Paystack not configured") ||
                    errorMessage.includes("Paystack credentials not configured")
                ) {
                    console.warn("Paystack not configured. Order created in demo mode.");
                    toast({
                        title: "✅ Demo Mode - Order Created",
                        description: "Your order has been created successfully! Paystack is in demo mode. To enable live payments, add Paystack secrets to Supabase.",
                        variant: "default",
                    });

                    return {
                        ...order,
                        ...orderData,
                        paystack_reference: "DEMO_MODE",
                    };
                }

                // If Paystack fails for other reasons, mark order as failed
                await supabase
                    .from("orders")
                    .update({ payment_status: "failed" })
                    .eq("id", order.id);

                console.error("Paystack error:", paystackError);
                throw new Error(
                    "Payment Initialization Failed: " + errorMessage + "\n\nTo enable Paystack payments:\n1. Add secrets to Supabase Edge Functions\n2. Secrets: PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY"
                );
            }
        },
        onSuccess: () => {
            closeCart();
        },
        onError: (error) => {
            console.error("Checkout error:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error ? error.message : "Failed to process checkout",
                variant: "destructive",
            });
        },
    });

    return {
        createOrder: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}
