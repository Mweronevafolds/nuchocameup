import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticInput } from "@/components/FuturisticInput";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react";
import { formatPrice } from "@/data/products";

type OrderStatus = "pending" | "processing" | "shipped" | "completed" | "cancelled";

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "pending",    label: "Confirmed",   icon: Clock },
  { status: "processing", label: "Preparing",   icon: Package },
  { status: "shipped",    label: "On the Way",  icon: Truck },
  { status: "completed",  label: "Delivered",   icon: CheckCircle },
];

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      // Allow searching by ID or Phone Number
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .or(`id.eq.${orderId},phone_number.eq.${orderId}`)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError("Order not found. Check the ID or phone number.");
      } else {
        setOrder(data);
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Failed to fetch tracking info.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: OrderStatus) => {
    const idx = STATUS_STEPS.findIndex((s) => s.status === status);
    return idx === -1 && status === "cancelled" ? -1 : idx;
  };

  const currentStatusIdx = order ? getStatusIndex(order.order_status) : -1;

  return (
    <main className="min-h-[80vh] bg-black py-20 px-4">
      <div className="max-w-xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display font-black text-4xl md:text-5xl text-white tracking-tighter uppercase">
            Track Your Fit
          </h1>
          <p className="font-body text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
            Enter your Order ID or the Phone Number used during checkout.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTrack} className="relative group">
          <FuturisticInput
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID / Phone Number"
            icon={<Search size={16} />}
            className="h-14"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-2 rounded-lg font-display font-bold text-xs tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loading ? "CHECKING..." : "TRACK"}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 animate-scale-in">
            <AlertCircle size={16} />
            <span className="text-xs font-mono-cyber uppercase tracking-wide">{error}</span>
          </div>
        )}

        {/* Results */}
        {order && (
          <div className="space-y-8 animate-slide-up">
            
            {/* Status Timeline */}
            <div className="glass-card rounded-2xl p-8 border border-white/10 bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5" />
              
              <div className="flex justify-between items-start relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 w-full h-[2px] bg-white/10 -z-0" />
                <div 
                  className="absolute top-5 left-0 h-[2px] bg-white transition-all duration-1000 -z-0" 
                  style={{ width: `${(currentStatusIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                />

                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= currentStatusIdx;
                  const isCurrent = i === currentStatusIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex flex-col items-center gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        isActive ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-black border-white/10 text-white/20"
                      }`}>
                        <Icon size={16} className={isCurrent ? "animate-pulse" : ""} />
                      </div>
                      <span className={`font-display text-[9px] font-black tracking-widest uppercase text-center ${
                        isActive ? "text-white" : "text-white/20"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {order.order_status === "cancelled" && (
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <p className="font-display text-xs font-bold text-red-500 tracking-[0.2em] uppercase">
                    [ ORDER CANCELLED ]
                  </p>
                </div>
              )}
            </div>

            {/* Order Info Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-white/5">
                <p className="font-mono-cyber text-[9px] text-white/25 uppercase tracking-widest mb-1">Estimated Delivery</p>
                <p className="font-display font-bold text-white text-sm">
                  {order.order_status === "completed" ? "Delivered" : "2–3 Business Days"}
                </p>
              </div>
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-white/5">
                <p className="font-mono-cyber text-[9px] text-white/25 uppercase tracking-widest mb-1">Carrier</p>
                <p className="font-display font-bold text-white text-sm uppercase">
                  {order.delivery_method === "pickup" ? "PickupMtaani" : "Local Courier"}
                </p>
              </div>
            </div>

            {/* Address / Pickup Point */}
            <div className="glass-card rounded-xl p-6 border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-2 text-white/40">
                <MapPin size={14} />
                <h3 className="font-display text-[10px] font-bold tracking-[0.25em] uppercase">Destination</h3>
              </div>
              <div className="font-body text-sm text-white/70 leading-relaxed">
                {order.delivery_method === "pickup" ? (
                  <p className="font-bold text-white uppercase">Pickup Point: {order.pickup_point_id || "Select Hub"}</p>
                ) : (
                  <>
                    <p>{order.shipping_address?.street}</p>
                    <p>{order.shipping_address?.city}, {order.shipping_address?.postalCode}</p>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
