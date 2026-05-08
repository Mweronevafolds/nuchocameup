// @ts-ignore: Deno types for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  orderId: string;
  callbackUrl: string;
}

interface StkPushResponse {
  CheckoutRequestID: string;
  MerchantRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

// M-Pesa configuration from environment variables
// @ts-ignore: Deno global available in Supabase Edge Functions
const CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") || "";
// @ts-ignore
const CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") || "";
// @ts-ignore
const SHORTCODE = Deno.env.get("MPESA_SHORTCODE") || "174379";
// @ts-ignore
const PASSKEY = Deno.env.get("MPESA_PASSKEY") || "";
// @ts-ignore
const ENV = Deno.env.get("MPESA_ENV") || "sandbox";

const BASE_URL =
  ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// Get M-Pesa access token
async function getAccessToken(): Promise<string> {
  // Debug: Log if credentials are missing
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    console.error("Missing M-Pesa credentials:", {
      hasConsumerKey: !!CONSUMER_KEY,
      hasConsumerSecret: !!CONSUMER_SECRET,
    });
    throw new Error("M-Pesa credentials not configured in Supabase secrets");
  }

  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);

  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("M-Pesa auth failed:", response.status, errorText);
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Initiate STK push
async function initiateStkPush(
  accessToken: string,
  phoneNumber: string,
  amount: number,
  orderId: string,
  callbackUrl: string
): Promise<StkPushResponse> {
  // Safaricom requires YYYYMMDDHHmmss in EAT (UTC+3)
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000); // shift to EAT
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp =
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds());

  // Format phone to 254XXXXXXXXX
  let formattedPhone = phoneNumber;
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith("254")) {
    formattedPhone = "254" + formattedPhone;
  }

  // Generate password
  const data = `${SHORTCODE}${PASSKEY}${timestamp}`;
  const password = btoa(data);

  // Safaricom limits: AccountReference ≤ 12 chars, TransactionDesc ≤ 13 chars
  // orderId is a UUID (36 chars) — must be truncated
  const shortRef = orderId.replace(/-/g, "").slice(0, 12);

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: shortRef,       // max 12 chars
    TransactionDesc: "2FlyDaily Pay",  // max 13 chars
  };

  console.log("STK push payload:", JSON.stringify({ ...payload, Password: "[REDACTED]" }));

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Safaricom STK push error:", response.status, errorBody);
    throw new Error(`STK push failed: ${response.status} ${errorBody}`);
  }

  return await response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const body: StkPushRequest = await req.json();

    // Validate input
    if (!body.phoneNumber || !body.amount || !body.orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Initiate STK push
    const result = await initiateStkPush(
      accessToken,
      body.phoneNumber,
      body.amount,
      body.orderId,
      body.callbackUrl
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
