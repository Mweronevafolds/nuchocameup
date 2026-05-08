import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAiBusinessInsights, getAiNewProductSuggestions } from "@/utils/ai";

export interface SalesMetrics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    completedOrders: number;
    pendingOrders: number;
    failedOrders: number;
}

export interface DailyRevenue {
    date: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
}

export interface ProductPerformance {
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
    averagePrice: number;
}

export interface AIInsights {
    topProduct: ProductPerformance | null;
    worstProduct: ProductPerformance | null;
    peakDay: DailyRevenue | null;
    slackDay: DailyRevenue | null;
    conversionTrend: "up" | "down" | "stable";
    revenueGrowth: number; // percentage
    recommendedActions: string[];
    nextBestProductToPromote: string;
}

export function useAnalytics() {
    // Fetch all sales data
    const { data: metrics = null, isLoading: metricsLoading } = useQuery({
        queryKey: ["salesMetrics"],
        queryFn: async (): Promise<SalesMetrics> => {
            const { data: orders, error } = await supabase
                .from("orders")
                .select("total_amount, payment_status, created_at");

            if (error) {
                console.error("Error fetching orders:", error);
                return {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    completedOrders: 0,
                    pendingOrders: 0,
                    failedOrders: 0,
                };
            }

            const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
            const completedOrders = orders.filter(o => o.payment_status === "completed").length;
            const pendingOrders = orders.filter(o => o.payment_status === "pending").length;
            const failedOrders = orders.filter(o => o.payment_status === "failed").length;

            return {
                totalRevenue,
                totalOrders: orders.length,
                averageOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
                completedOrders,
                pendingOrders,
                failedOrders,
            };
        },
    });

    // Fetch daily revenue trends
    const { data: dailyRevenue = [] } = useQuery({
        queryKey: ["dailyRevenue"],
        queryFn: async (): Promise<DailyRevenue[]> => {
            const { data: orders, error } = await supabase
                .from("orders")
                .select("total_amount, created_at, payment_status")
                .eq("payment_status", "completed");

            if (error) return [];

            // Group by date
            const grouped = orders.reduce((acc: Record<string, any>, order) => {
                const date = order.created_at.split("T")[0];
                if (!acc[date]) {
                    acc[date] = { revenue: 0, count: 0, amounts: [] };
                }
                acc[date].revenue += order.total_amount;
                acc[date].count += 1;
                acc[date].amounts.push(order.total_amount);
                return acc;
            }, {});

            return Object.entries(grouped).map(([date, data]: any) => ({
                date,
                revenue: data.revenue,
                orders: data.count,
                avgOrderValue: Math.round(data.revenue / data.count),
            }));
        },
    });

    // Fetch product performance
    const { data: productPerformance = [] } = useQuery({
        queryKey: ["productPerformance"],
        queryFn: async (): Promise<ProductPerformance[]> => {
            const { data: items, error } = await supabase
                .from("order_items")
                .select("product_id, product_name, product_price, quantity");

            if (error) return [];

            // Group by product
            const grouped = items.reduce((acc: Record<string, any>, item) => {
                const key = item.product_id;
                if (!acc[key]) {
                    acc[key] = {
                        id: item.product_id,
                        name: item.product_name,
                        unitsSold: 0,
                        revenue: 0,
                        prices: [],
                    };
                }
                acc[key].unitsSold += item.quantity;
                acc[key].revenue += item.product_price * item.quantity;
                acc[key].prices.push(item.product_price);
                return acc;
            }, {});

            return Object.values(grouped).map((p: any) => ({
                ...p,
                averagePrice: Math.round(p.revenue / p.unitsSold),
            }));
        },
    });

    // Calculate AI insights
    const { data: insights = null } = useQuery({
        queryKey: ["aiInsights", metrics, dailyRevenue, productPerformance],
        queryFn: async (): Promise<AIInsights> => {
            if (!metrics || dailyRevenue.length === 0) {
                return {
                    topProduct: null,
                    worstProduct: null,
                    peakDay: null,
                    slackDay: null,
                    conversionTrend: "stable",
                    revenueGrowth: 0,
                    recommendedActions: [],
                    nextBestProductToPromote: "N/A",
                };
            }

            // Find top and worst products
            const topProduct = productPerformance.reduce((max, p) =>
                !max || p.revenue > max.revenue ? p : max, null);
            const worstProduct = productPerformance.reduce((min, p) =>
                !min || (p.revenue > 0 && p.revenue < min.revenue) ? p : min, null);

            // Find peak and slack days
            const peakDay = dailyRevenue.reduce((max, d) =>
                d.revenue > (max?.revenue || 0) ? d : max, null);
            const slackDay = dailyRevenue.reduce((min, d) =>
                d.revenue > 0 && d.revenue < (min?.revenue || Infinity) ? d : min, null);

            // Calculate revenue growth (last 7 days vs previous 7 days)
            const last7 = dailyRevenue.slice(-7);
            const prev7 = dailyRevenue.slice(-14, -7);
            const last7Rev = last7.reduce((sum, d) => sum + d.revenue, 0);
            const prev7Rev = prev7.reduce((sum, d) => sum + d.revenue, 0);
            const revenueGrowth = prev7Rev > 0 ? ((last7Rev - prev7Rev) / prev7Rev) * 100 : 0;

            // Conversion trend analysis
            const conversionRate = metrics.totalOrders > 0 ?
                (metrics.completedOrders / metrics.totalOrders) * 100 : 0;
            const conversionTrend: "up" | "down" | "stable" =
                conversionRate > 70 ? "up" : conversionRate < 40 ? "down" : "stable";

            // Generate real AI recommendations using Gemini
            const roundedRevenueGrowth = Math.round(revenueGrowth * 10) / 10;
            const recommendedActions = await getAiBusinessInsights(
                metrics,
                productPerformance,
                roundedRevenueGrowth
            );

            // Fallback if AI fails or returns empty
            if (recommendedActions.length === 0) {
                if (metrics.pendingOrders > metrics.completedOrders * 0.3) {
                    recommendedActions.push("High pending orders - Follow up on payment prompts");
                }
                if (revenueGrowth < -10) {
                    recommendedActions.push("Revenue declining - Boost marketing campaigns");
                }
                if (revenueGrowth > 20) {
                    recommendedActions.push("Strong growth momentum - Capitalize with new products");
                }
            }

            return {
                topProduct,
                worstProduct,
                peakDay,
                slackDay,
                conversionTrend,
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                recommendedActions,
                nextBestProductToPromote: topProduct?.name || "N/A",
            };
        },
    });

    // Fetch new product suggestions
    const { data: suggestions = [] } = useQuery({
        queryKey: ["aiSuggestions", metrics, productPerformance],
        queryFn: async () => {
            if (!metrics || productPerformance.length === 0) return [];
            return await getAiNewProductSuggestions(metrics, productPerformance);
        },
        enabled: !!metrics && productPerformance.length > 0,
    });

    return {
        metrics,
        metricsLoading,
        dailyRevenue,
        productPerformance,
        insights,
        suggestions,
    };
}
