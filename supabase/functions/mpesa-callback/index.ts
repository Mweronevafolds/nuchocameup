// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    // Safaricom callback structure
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("Invalid callback structure:", body);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutRequestId: string = stkCallback.CheckoutRequestID;
    const resultCode: number = stkCallback.ResultCode;       // 0 = success
    const resultDesc: string = stkCallback.ResultDesc;

    console.log(`Payment result for ${checkoutRequestId}: ${resultCode} - ${resultDesc}`);

    if (resultCode === 0) {
      // ── Payment successful ──────────────────────────────────────────────────
      const items: any[] = stkCallback.CallbackMetadata?.Item || [];
      const get = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptNumber = get("MpesaReceiptNumber");
      const amount            = get("Amount");
      const phoneNumber       = get("PhoneNumber");
      const transactionDate   = get("TransactionDate");

      // Update order by matching mpesa_transaction_id (CheckoutRequestID stored on STK push)
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          order_status: "processing",
          mpesa_transaction_id: mpesaReceiptNumber,  // overwrite with final receipt
        })
        .eq("mpesa_transaction_id", checkoutRequestId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
      } else {
        console.log(`✅ Order updated to completed. Receipt: ${mpesaReceiptNumber}, Amount: ${amount}, Phone: ${phoneNumber}, Date: ${transactionDate}`);
      }
    } else {
      // ── Payment failed / cancelled ──────────────────────────────────────────
      console.warn(`Payment failed/cancelled: ${resultDesc}`);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("mpesa_transaction_id", checkoutRequestId);

      if (updateError) {
        console.error("Failed to update failed order:", updateError);
      }
    }

    // Always return 200 to Safaricom to acknowledge receipt
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Callback handler error:", error);
    // Still return 200 so Safaricom doesn't retry endlessly
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
