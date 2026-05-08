// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail, customerPhone, orderStatus, items } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE");

    if (!customerEmail && !customerPhone) {
      throw new Error("Customer email or phone required");
    }

    // Email notification
    if (customerEmail && RESEND_API_KEY) {
      try {
        let subject = "Order Confirmed";
        let body = `Your order #${orderId} has been confirmed.\n\nItems ordered:\n`;

        if (items && Array.isArray(items)) {
          items.forEach((item: any) => {
            body += `- ${item.product_name} (${item.quantity}x)\n`;
          });
        }

        body += `\nYou will receive tracking updates shortly.\n\n2FLY DAILY®`;

        if (orderStatus === "processing") {
          subject = "Order Processing";
          body = `Your order #${orderId} is being prepared for shipment.\n\nWe'll notify you when it's on the way.\n\n2FLY DAILY®`;
        } else if (orderStatus === "shipped") {
          subject = "Order Shipped";
          body = `Your order #${orderId} is on the way!\n\nTrack your order at: ${Deno.env.get("STORE_URL") || "https://2flydaily.com"}/track\n\n2FLY DAILY®`;
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "2FLY DAILY <orders@updates.2flydaily.com>",
            to: customerEmail,
            subject,
            text: body,
          }),
        });

        if (!res.ok) {
          console.error("Email notification failed:", await res.text());
        } else {
          console.log(`Order email sent to ${customerEmail}`);
        }
      } catch (err) {
        console.error("Email notification error:", err);
      }
    }

    // SMS notification
    if (customerPhone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        let message = `🔥 2FLY Order Update 🔥\n\nOrder #${orderId}\nStatus: ${orderStatus.toUpperCase()}\n\nTrack: ${Deno.env.get("STORE_URL") || "https://2flydaily.com"}/track\n\n2FLY DAILY®`;

        if (orderStatus === "confirmed" || orderStatus === "pending") {
          message = `✅ Order Confirmed!\n\nOrder #${orderId} received.\nYour fit is being prepared.\n\n2FLY DAILY®`;
        }

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            },
            body: new URLSearchParams({
              From: TWILIO_PHONE,
              To: `+${customerPhone}`,
              Body: message,
            }).toString(),
          }
        );

        if (!res.ok) {
          console.error("SMS notification failed:", await res.text());
        } else {
          console.log(`Order SMS sent to +${customerPhone}`);
        }
      } catch (err) {
        console.error("SMS notification error:", err);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Order notification sent",
        email: customerEmail ? "sent" : "skipped",
        sms: customerPhone ? "sent" : "skipped",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Order notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
