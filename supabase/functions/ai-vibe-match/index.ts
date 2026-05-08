// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sizes: string[];
}

interface RequestPayload {
  action?: "search" | "recommend";
  q?: string;
  productId?: string;
  products?: Product[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, q, productId, products } = (await req.json()) as RequestPayload;

    if (!action || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required parameters or products catalog." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!API_KEY) {
      console.warn("Missing GEMINI_API_KEY environment variable.");
      return new Response(JSON.stringify({ error: "API Key not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt = "";
    if (action === "search") {
      prompt = `AI stylist mode. User search: "${q}". Find matching vibes from catalog. Be decisive, max 8 picks.

Catalog (id, name, price, desc):
${JSON.stringify(
  products.map((p) => ({ id: p.id, name: p.name, price: p.price, desc: p.description }))
)}

Return ONLY JSON array of product IDs. No markdown.`;
    } else if (action === "recommend") {
      const target = products.find((p) => p.id === productId);
      if (!target) throw new Error("Target product not found in catalog");

      prompt = `Stylist mode ON. User eyeing: "${target.name}" (${target.price}). Complete The Fit with 2-4 fire items.

Catalog (id, name, price, desc):
${JSON.stringify(
  products
    .filter((p) => p.id !== target.id)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, desc: p.description }))
)}

Return ONLY JSON array of product IDs. Be confident.`;
    } else {
      throw new Error("Invalid action provided");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temp for more deterministic output
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error("Failed to communicate with LLM provider.");
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Clean string incase LLM returns ```json...``` markdown
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    const matchedIds = JSON.parse(cleanedJson);

    return new Response(JSON.stringify({ matchedIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
