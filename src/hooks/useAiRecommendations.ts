import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAiRecommendations } from "@/utils/ai";
import { useProducts, type DbProduct } from "./useProducts";

export function useAiRecommendations(productId: string | undefined) {
  const { data: allProducts, isLoading: productsLoading } = useProducts();

  return useQuery({
    queryKey: ["ai-recommendations", productId],
    queryFn: async () => {
      if (!productId || !allProducts || allProducts.length === 0) return [];

      try {
        const matchedIds = await getAiRecommendations(productId, allProducts);
        
        if (!matchedIds || matchedIds.length === 0) throw new Error("No matches");

        // Return actual product objects
        return allProducts.filter(p => matchedIds.includes(p.id));
      } catch (err) {
        console.warn("Falling back to random recommendations due to error:", err);
        // Fallback: Random 3 items
        return [...allProducts]
          .filter(p => p.id !== productId)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      }
    },
    enabled: !!productId && !!allProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
