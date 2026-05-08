import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import type { DbProduct } from "./useProducts";
import { getAiVibeMatch } from "@/utils/ai";

export interface SearchFilters {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    inStock?: boolean;
    sort?: "price-asc" | "price-desc" | "newest" | "bestselling";
}

export function useSearch(filters: SearchFilters) {
    const debouncedQuery = useDebounce(filters.q || "", 300);

    return useQuery({
        queryKey: ["search", debouncedQuery, filters],
        queryFn: async () => {
            try {
                let query = supabase.from("products").select("*");

                // Natural language AI Search Hook
                let aiMatchedIds: string[] | null = null;
                if (debouncedQuery) {
                    try {
                        // Get catalog context for AI
                        const { data: allProducts } = await supabase.from("products").select("*");
                        const contextProducts = allProducts || [];
                        
                        if (contextProducts.length > 0) {
                            // Use direct client-side utility since user lacks edge deployment context
                            const matchedIds = await getAiVibeMatch(debouncedQuery, contextProducts as DbProduct[]);

                            if (matchedIds && matchedIds.length > 0) {
                                aiMatchedIds = matchedIds;
                            }
                        }
                    } catch (e) {
                        console.warn("AI search unavailable, falling back to basic search", e);
                    }
                }

                if (aiMatchedIds && aiMatchedIds.length > 0) {
                    query = query.in("id", aiMatchedIds);
                } else if (debouncedQuery) {
                    // Fallback to traditional text search
                    query = query.or(
                        `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`
                    );
                }

                // Price filter
                if (filters.minPrice !== undefined) {
                    query = query.gte("price", filters.minPrice);
                }
                if (filters.maxPrice !== undefined) {
                    query = query.lte("price", filters.maxPrice);
                }

                // Stock filter
                if (filters.inStock !== undefined) {
                    query = query.eq("sold_out", !filters.inStock);
                }

                // Size filter (if needed, would require different schema)
                // For now, filtering happens on client side

                // Sorting
                switch (filters.sort) {
                    case "price-asc":
                        query = query.order("price", { ascending: true });
                        break;
                    case "price-desc":
                        query = query.order("price", { ascending: false });
                        break;
                    case "newest":
                        query = query.gte(
                            "created_at",
                            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                        );
                        query = query.order("created_at", { ascending: false });
                        break;
                    case "bestselling":
                        // TODO: Add bestseller ranking to products table
                        query = query.order("created_at", { ascending: false });
                        break;
                }

                const { data, error } = await query;

                if (error) {
                    console.warn("Error searching products from Supabase:", error);
                    return [];
                }

                // Client-side size filtering
                let results = data as DbProduct[];
                if (filters.sizes && filters.sizes.length > 0) {
                    results = results.filter((product) =>
                        filters.sizes!.some((size) => product.sizes.includes(size))
                    );
                }

                return results;
            } catch (error) {
                console.warn("Search failed:", error);
                return [];
            }
        },
    });
}

/**
 * Get available price range from products
 */
export function useAvailablePrices(products: DbProduct[] | undefined) {
    return useMemo(() => {
        if (!products || products.length === 0) {
            return { min: 0, max: 0 };
        }

        const prices = products.map((p) => p.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
        };
    }, [products]);
}

/**
 * Get all available sizes from products
 */
export function useAvailableSizes(products: DbProduct[] | undefined) {
    return useMemo(() => {
        if (!products || products.length === 0) {
            return [];
        }

        const sizes = new Set<string>();
        products.forEach((p) => {
            p.sizes.forEach((size) => sizes.add(size));
        });

        return Array.from(sizes).sort();
    }, [products]);
}
