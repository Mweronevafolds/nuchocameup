import { useAnalytics } from "@/hooks/useAnalytics";
import { TrendingUp, TrendingDown, AlertCircle, Target, Zap, DollarSign, ShoppingCart, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/data/products";

export function AnalyticsDashboard() {
    const { metrics, dailyRevenue, productPerformance, insights, suggestions } = useAnalytics();

    if (!metrics || !insights) {
        return <div className="p-6">Loading analytics...</div>;
    }

    const completionRate = metrics.totalOrders > 0
        ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100)
        : 0;

    return (
        <div className="space-y-6 text-white pb-20">
            {/* Header */}
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black font-display uppercase tracking-tighter mb-1">System Analytics</h2>
                <p className="text-xs font-mono-cyber tracking-widest text-white/40 uppercase">AI-powered insights / 2FLY X</p>
            </div>

            {/* AI Insights Section - HYPE DIRECTIVES */}
            {insights.recommendedActions.length > 0 && (
                <div className="border border-white/20 bg-gradient-to-r from-white/8 to-white/3 p-6 hover:border-white/40 transition-colors">
                    <div className="flex gap-4">
                        <div className="text-2xl animate-pulse">⚡</div>
                        <div className="flex-1">
                            <h3 className="font-bold font-display uppercase tracking-wide text-white mb-4 text-lg">🎯 SYSTEM HYPE CHECK</h3>
                            <ul className="space-y-2.5">
                                {insights.recommendedActions.map((action, i) => {
                                    const icons = ["🔴", "🟡", "🟢"];
                                    return (
                                        <li 
                                            key={i} 
                                            className="text-sm font-mono-cyber text-white/80 uppercase tracking-wider flex items-start gap-2 p-2 border-l-2 border-electric-blue/50 pl-3 bg-white/3 hover:bg-white/8 transition-all cursor-pointer hover:border-electric-blue"
                                        >
                                            <span className="flex-shrink-0 text-base">{icons[i % icons.length]}</span>
                                            <span>{action}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-mono-cyber tracking-widest text-white/50 uppercase">Total Revenue</p>
                            <p className="text-xl font-black font-display mt-2">{formatPrice(metrics.totalRevenue)}</p>
                        </div>
                        <DollarSign className="text-white/40" size={16} />
                    </div>
                    <p className="text-[10px] font-mono-cyber text-white/70 flex items-center gap-2 uppercase">
                        <TrendingUp size={12} /> {metrics.totalOrders} transactions
                    </p>
                </div>

                {/* Average Order Value */}
                <div className="border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-mono-cyber tracking-widest text-white/50 uppercase">Avg Order</p>
                            <p className="text-xl font-black font-display mt-2">{formatPrice(metrics.averageOrderValue)}</p>
                        </div>
                        <ShoppingCart className="text-white/40" size={16} />
                    </div>
                    <p className="text-[10px] font-mono-cyber text-white/70 uppercase">Per Cart</p>
                </div>

                {/* Completion Rate */}
                <div className="border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-mono-cyber tracking-widest text-white/50 uppercase">Completion</p>
                            <p className="text-xl font-black font-display mt-2">{completionRate}%</p>
                        </div>
                        <CheckCircle className="text-white/40" size={16} />
                    </div>
                    <p className="text-[10px] font-mono-cyber text-white/70 uppercase">{metrics.completedOrders}/{metrics.totalOrders} Cleared</p>
                </div>

                {/* Revenue Growth */}
                <div className="border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-mono-cyber tracking-widest text-white/50 uppercase">Growth (7D)</p>
                            <p className="text-xl font-black font-display mt-2">
                                {insights.revenueGrowth > 0 ? '+' : ''}{insights.revenueGrowth}%
                            </p>
                        </div>
                        {insights.revenueGrowth >= 0 ?
                            <TrendingUp className="text-white/40" size={16} /> :
                            <TrendingDown className="text-white/40" size={16} />
                        }
                    </div>
                    <p className="text-[10px] font-mono-cyber text-white/70 uppercase">vs Last Week</p>
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="border border-white/10 p-6 bg-white/5">
                <h3 className="font-mono-cyber text-xs tracking-widest text-white/50 uppercase mb-6">[ Status Breakdown ]</h3>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <div className="text-3xl font-display font-black text-white">{metrics.completedOrders}</div>
                        <p className="text-[10px] font-mono-cyber text-white/40 mt-2 uppercase tracking-widest">Cleared</p>
                        <div className="w-full bg-white/5 h-1 mt-3">
                            <div className="bg-white h-1" style={{ width: `${(metrics.completedOrders / metrics.totalOrders) * 100}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-display font-black text-white">{metrics.pendingOrders}</div>
                        <p className="text-[10px] font-mono-cyber text-white/40 mt-2 uppercase tracking-widest">Pending</p>
                        <div className="w-full bg-white/5 h-1 mt-3">
                            <div className="bg-white/50 h-1" style={{ width: `${(metrics.pendingOrders / metrics.totalOrders) * 100}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-display font-black text-white">{metrics.failedOrders}</div>
                        <p className="text-[10px] font-mono-cyber text-white/40 mt-2 uppercase tracking-widest">Failed</p>
                        <div className="w-full bg-white/5 h-1 mt-3">
                            <div className="bg-white/20 h-1" style={{ width: `${(metrics.failedOrders / metrics.totalOrders) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Performance */}
            <div className="border border-white/10 p-6 bg-white/5">
                <h3 className="font-mono-cyber text-xs tracking-widest text-white/50 uppercase mb-6">[ Top Performing Assets ]</h3>
                {productPerformance.length === 0 ? (
                    <p className="text-white/40 text-[10px] font-mono-cyber uppercase">No sales data logged.</p>
                ) : (
                    <div className="space-y-4">
                        {productPerformance
                            .sort((a, b) => b.revenue - a.revenue)
                            .slice(0, 5)
                            .map((product) => (
                                <div key={product.id} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold font-display uppercase tracking-wide">{product.name}</p>
                                        <p className="text-[10px] font-mono-cyber text-white/40 uppercase mt-1">{product.unitsSold} units deployed</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold font-mono-cyber text-sm tracking-widest">{formatPrice(product.revenue)}</p>
                                        <p className="text-[10px] font-mono-cyber text-white/40 uppercase mt-1">{formatPrice(product.averagePrice)} avg</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Peak vs Slack Days */}
            <div className="grid md:grid-cols-2 gap-4">
                {insights.peakDay && (
                    <div className="border border-white/20 bg-white/10 p-6">
                        <div className="flex items-start gap-4">
                            <TrendingUp className="text-white mt-1" size={20} />
                            <div>
                                <h3 className="font-mono-cyber text-[10px] tracking-widest text-white/50 uppercase">[ Maximum Velocity ]</h3>
                                <p className="text-2xl font-black font-display mt-2">{insights.peakDay.date}</p>
                                <div className="mt-3 space-y-1 text-xs font-mono-cyber text-white/70 uppercase">
                                    <p>Rev: {formatPrice(insights.peakDay.revenue)}</p>
                                    <p>Qty: {insights.peakDay.orders}</p>
                                    <p>Avg: {formatPrice(insights.peakDay.avgOrderValue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {insights.slackDay && (
                    <div className="border border-white/5 bg-transparent p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="text-white/40 mt-1" size={20} />
                            <div>
                                <h3 className="font-mono-cyber text-[10px] tracking-widest text-white/50 uppercase">[ Minimum Velocity ]</h3>
                                <p className="text-2xl font-black font-display text-white/70 mt-2">{insights.slackDay.date}</p>
                                <div className="mt-3 space-y-1 text-xs font-mono-cyber text-white/40 uppercase">
                                    <p>Rev: {formatPrice(insights.slackDay.revenue)}</p>
                                    <p>Qty: {insights.slackDay.orders}</p>
                                    <p>Avg: {formatPrice(insights.slackDay.avgOrderValue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Insights Details */}
            <div className="grid md:grid-cols-2 gap-4">
                {insights.topProduct && (
                    <div className="border border-white/10 p-6 bg-white/5">
                        <h3 className="font-mono-cyber text-[10px] tracking-widest text-white/50 uppercase mb-4">[ Prime Asset ]</h3>
                        <p className="text-lg font-bold font-display uppercase">{insights.topProduct.name}</p>
                        <div className="mt-4 space-y-2 text-xs font-mono-cyber text-white/70 uppercase">
                            <p>Deployed: {insights.topProduct.unitsSold}</p>
                            <p>Yield: {formatPrice(insights.topProduct.revenue)}</p>
                        </div>
                    </div>
                )}

                {insights.worstProduct && (
                    <div className="border border-white/10 p-6 bg-white/5">
                        <h3 className="font-mono-cyber text-[10px] tracking-widest text-white/50 uppercase mb-4">[ Underperforming Asset ]</h3>
                        <p className="text-lg font-bold font-display uppercase">{insights.worstProduct.name}</p>
                        <div className="mt-4 space-y-2 text-xs font-mono-cyber text-white/70 uppercase">
                            <p>Deployed: {insights.worstProduct.unitsSold}</p>
                            <p>Yield: {formatPrice(insights.worstProduct.revenue)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Inventory Directives / New Product Suggestions - CURIOSITY TILES */}
            {suggestions.length > 0 && (
                <div className="border border-white/10 p-6 bg-white/5">
                    <h3 className="font-mono-cyber text-xs tracking-widest text-white/50 uppercase mb-6">🚀 NEXT DROPS [ Curiosity Tiles ]</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {suggestions.map((item, i) => {
                            const emojis = ["🔥", "💎", "⚡"];
                            const emoji = emojis[i % emojis.length];
                            return (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden border-2 border-white/20 bg-gradient-to-br from-white/8 via-white/3 to-transparent p-4 hover:border-white/50 hover:from-white/15 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-white/10"
                                >
                                    {/* Glowing background on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/0 via-electric-blue/0 to-purple/0 group-hover:from-electric-blue/10 group-hover:via-electric-blue/5 group-hover:to-purple/10 transition-all duration-300" />

                                    {/* Content */}
                                    <div className="relative z-10 space-y-2">
                                        {/* Emoji + Suggestion */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl flex-shrink-0 animate-pulse group-hover:animate-bounce">{emoji}</span>
                                            <p className="font-bold font-display uppercase text-sm tracking-wide text-white leading-tight">
                                                {item.suggestion}
                                            </p>
                                        </div>

                                        {/* Rationale - SHORT & PUNCHY */}
                                        <p className="text-[11px] font-mono-cyber text-white/60 leading-snug uppercase tracking-wider line-clamp-2 group-hover:text-white/80 transition-colors">
                                            → {item.rationale}
                                        </p>

                                        {/* Visual indicator */}
                                        <div className="mt-3 h-0.5 w-full bg-gradient-to-r from-electric-blue/50 via-electric-blue/20 to-transparent group-hover:from-electric-blue/80 group-hover:via-electric-blue/40 transition-all" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
