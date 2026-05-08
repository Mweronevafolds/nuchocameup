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
    const { productName, price, url, templateType, channel } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not set");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Fetch active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscriptions")
      .select("email, phone_number")
      .eq("is_active", true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: "No email subscribers found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Email broadcasts
    if ((channel === "email" || !channel) && RESEND_API_KEY) {
      const emailSubscribers = subscribers.filter((s) => s.email);
      if (emailSubscribers.length > 0) {
        try {
          const subject = templateType === "mysterious"
            ? "STILL FLY? NEW DROP DETECTED."
            : "NEW DROP ALERT";
          const body = templateType === "mysterious"
            ? `[ INCOMING TRANSMISSION ]\n\nA new asset has been deployed to the 2FLY grid:\nNAME: ${productName.toUpperCase()}\nVALUATION: ${price}\n\nAccess restricted to the inner circle.\nClaim yours before the signal fades.\n\nVIEW DROP: ${url}\n\n2FLY DAILY® — FOREVA FLY.`
            : `NEW DROP: ${productName} is LIVE. ${price}. Limited stock. Secure the fit now: ${url}`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "2FLY DAILY <drops@updates.2flydaily.com>",
              to: "crew@2flydaily.com",
              bcc: emailSubscribers.map((s) => s.email),
              subject,
              text: body,
            }),
          });

          if (res.ok) {
            sentCount += emailSubscribers.length;
            console.log(`Email broadcast sent to ${emailSubscribers.length} subscribers`);
          } else {
            failedCount += emailSubscribers.length;
            console.error("Email broadcast failed:", await res.text());
          }
        } catch (err) {
          console.error("Email broadcast error:", err);
          failedCount += emailSubscribers.length;
        }
      }
    }

    // SMS/WhatsApp broadcasts via Twilio
    if ((channel === "sms" || channel === "whatsapp") && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      const phoneSubscribers = subscribers.filter((s) => s.phone_number);
      if (phoneSubscribers.length > 0) {
        try {
          const message = `🔥 2FLY DROP ALERT 🔥\n\n${productName} is LIVE.\n${price}\nLimited stock. Secure yours now:\n${url}\n\n2FLY DAILY®`;
          const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

          for (const sub of phoneSubscribers) {
            if (!sub.phone_number) continue;

            const phoneNumber = channel === "whatsapp"
              ? `whatsapp:+${sub.phone_number}`
              : `+${sub.phone_number}`;

            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              },
              body: new URLSearchParams({
                From: channel === "whatsapp" ? `whatsapp:${TWILIO_PHONE}` : TWILIO_PHONE,
                To: phoneNumber,
                Body: message,
              }).toString(),
            });

            if (res.ok) {
              sentCount++;
            } else {
              failedCount++;
              console.error(`${channel.toUpperCase()} send failed for ${phoneNumber}`);
            }
          }
          console.log(`${channel.toUpperCase()} broadcasts sent to ${sentCount} subscribers`);
        } catch (err) {
          console.error(`${channel} broadcast error:`, err);
          failedCount += phoneSubscribers.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Broadcast completed",
        sent: sentCount,
        failed: failedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
