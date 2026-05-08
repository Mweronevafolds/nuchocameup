import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image_url: string | null;
  sold_out: boolean;
  sizes: string[];
  description: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true });
        
        if (error) {
          console.warn("Error fetching products from Supabase:", error);
          return [];
        }
        
        console.log("Products fetched from Supabase:", data);
        return data as DbProduct[];
      } catch (error) {
        console.warn("Failed to fetch from Supabase:", error);
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) {
          console.warn("Error fetching product from Supabase:", error);
          return null;
        }
        
        return data as DbProduct;
      } catch (error) {
        console.warn("Failed to fetch product from Supabase:", error);
        return null;
      }
    },
    enabled: !!id,
  });
}
