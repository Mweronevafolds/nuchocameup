import { DbProduct } from "@/hooks/useProducts";

// Fallback to empty string if not in env
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    // If it's a 503 or 429, wait and retry
    if (response.status === 503 || response.status === 429) {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
      continue;
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }
  throw new Error("Gemini API error after retries");
}

export async function getAiVibeMatch(query: string, products: DbProduct[]): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set.");
    return [];
  }

  const prompt = `AI stylist here. User said: "${query}". Find matching products that HIT that vibe. Be decisive.

Catalog (id, name, price, desc):
${JSON.stringify(
  products.map((p) => ({ id: p.id, name: p.name, price: p.price, desc: p.description }))
)}

Return ONLY a JSON array of product IDs that match. Max 8. No markdown, just the array.`;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("AI Vibe Match failed:", error);
    return [];
  }
}

export async function getAiRecommendations(productId: string, products: DbProduct[]): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set.");
    return [];
  }

  const target = products.find((p) => p.id === productId);
  if (!target) return [];

  const prompt = `Stylist mode ON. User's eyeing: "${target.name}" (${target.price}).
Help them Complete The Fit. Pick 2-4 items from catalog that GO HARD together.

Catalog:
${JSON.stringify(
  products
    .filter((p) => p.id !== target.id)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, desc: p.description }))
)}

Return ONLY JSON array of product IDs. Be confident. No explanations.`;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("AI Recommendations failed:", error);
    return [];
  }
}

export async function getAiBusinessInsights(
  metrics: any,
  productPerformance: any[],
  revenueGrowth: number
): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set.");
    return [];
  }

  const prompt = `You are a street-smart business AI for '2FLY Daily'. Give EXACTLY 3 SHORT, PUNCHY directives (10-15 words max each). Be a hype man.

Metrics: Revenue KES ${metrics.totalRevenue}, Orders: ${metrics.totalOrders}, Growth: ${revenueGrowth}%, Pending: ${metrics.pendingOrders}

Top movers: ${productPerformance.slice(0, 3).map(p => p.name).join(", ")}

Make each directive a quick wake-up call. Use energy. Examples: "Stack those hoodies—they're PRINTING", "Pending orders killing you—automate shipping NOW".
Return ONLY a valid JSON array of 3 strings. No markdown.`;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(cleanedJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("AI Business Insights failed:", error);
    return [];
  }
}

export async function getAiProductDescription(productName: string): Promise<string> {
  if (!GEMINI_API_KEY) return "";

  const prompt = `Write a SHORT, ADDICTIVE product description for '2FLY Daily' streetwear. Max 25 words. Vibe-first. Make it FOMO.
  Product: "${productName}"
  Be like TikTok copy—snappy, punchy, a little cheeky. 
  Return ONLY the description. No quotes, no markdown.`;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (error) {
    console.error("AI Description generation failed:", error);
    return "";
  }
}

export async function getAiNewProductSuggestions(
  metrics: any,
  productPerformance: any[]
): Promise<{ suggestion: string; rationale: string }[]> {
  if (!GEMINI_API_KEY) return [];

  const prompt = `You're a hype product curator for '2FLY Daily'. Suggest 3 NEW items that would POP off based on what's selling:
  
Revenue: KES ${metrics.totalRevenue}
Hot items: ${productPerformance.slice(0, 3).map(p => p.name).join(", ")}

For EACH suggestion:
- suggestion: The actual product (e.g., "Fire Red Cargo Pants", "Oversized Wool Coat")
- rationale: WHY in 1 punchy sentence max (10-15 words). Be viral. Make it FOMO.

Example rationale: "Cargo's trending hard rn, your buyers will eat this up"
Return ONLY valid JSON. No markdown.`;

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8 },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("AI New Product Suggestions failed:", error);
    return [];
  }
}

