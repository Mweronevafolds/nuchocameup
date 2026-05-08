// @ts-ignore: Deno types for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface InitializeRequest {
    email: string;
    amount: number;
    orderId: string;
    metadata?: Record<string, any>;
}

interface InitializeResponse {
    status: boolean;
    message: string;
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
    error?: string;
}

// Paystack configuration from environment variables
// @ts-ignore: Deno global available in Supabase Edge Functions
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
// @ts-ignore
const PAYSTACK_PUBLIC_KEY = Deno.env.get("PAYSTACK_PUBLIC_KEY") || "";

const PAYSTACK_API_URL = "https://api.paystack.co";

// Initialize Paystack transaction
async function initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, any>
): Promise<InitializeResponse> {
    if (!PAYSTACK_SECRET_KEY) {
        console.error("Missing Paystack secret key");
        return {
            status: false,
            message: "Paystack not configured",
            error: "Paystack credentials not configured in Supabase secrets",
        };
    }

    try {
        const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100), // Convert to cents
                reference,
                metadata: {
                    ...metadata,
                    custom_fields: [
                        {
                            display_name: "Order Reference",
                            variable_name: "order_ref",
                            value: reference,
                        },
                    ],
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Paystack initialization failed:", response.status, errorData);
            return {
                status: false,
                message: "Failed to initialize transaction",
                error: errorData.message || "Paystack API error",
            };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Paystack initialization error:", error);
        return {
            status: false,
            message: "Error initializing transaction",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Handle CORS and requests
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }

    try {
        const body: InitializeRequest = await req.json();
        const { email, amount, orderId, metadata } = body;

        // Validate input
        if (!email || !amount || !orderId) {
            return new Response(
                JSON.stringify({
                    status: false,
                    message: "Missing required fields: email, amount, orderId",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        const result = await initializeTransaction(email, amount, orderId, metadata);

        return new Response(JSON.stringify(result), {
            status: result.status ? 200 : 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Function error:", error);
        return new Response(
            JSON.stringify({
                status: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
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
