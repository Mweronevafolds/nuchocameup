import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, RefreshCw, Phone, ShoppingBag, Printer } from "lucide-react";

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 120_000;

export default function OrderConfirmationPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate        = useNavigate();
  const location        = useLocation();
  const queryClient     = useQueryClient();

  const [timedOut,    setTimedOut]    = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(TIMEOUT_MS / 1000));

  const isPendingPayment = !!location.state?.checkoutRequestId;

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (id, product_name, product_price, size, quantity)`)
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
    refetchInterval: false,
    staleTime: 0,
  });

  const isCompleted = order?.payment_status === "completed";
  const isFailed    = order?.payment_status === "failed";
  const isPending   = !isCompleted && !isFailed;

  useEffect(() => {
    if (!isPendingPayment || isCompleted || isFailed || timedOut) return;
    const pollTimer      = setInterval(() => refetch(), POLL_INTERVAL_MS);
    const countdownTimer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const timeoutTimer   = setTimeout(() => {
      setTimedOut(true);
      clearInterval(pollTimer);
      clearInterval(countdownTimer);
    }, TIMEOUT_MS);
    return () => { clearInterval(pollTimer); clearInterval(countdownTimer); clearTimeout(timeoutTimer); };
  }, [isPendingPayment, isCompleted, isFailed, timedOut, refetch]);

  useEffect(() => {
    if (!orderId || !isPendingPayment) return;
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => queryClient.invalidateQueries({ queryKey: ["order", orderId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, isPendingPayment, queryClient]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-40 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-60 w-full rounded-xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-white/50" />
          <h1 className="font-display text-xl font-bold text-white">Order Not Found</h1>
          <p className="font-body text-sm text-white/40">We couldn't find your order details.</p>
          <button onClick={() => navigate("/")} className="holo-btn rounded-xl px-6 py-3 text-sm font-display tracking-widest">
            Return Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-16 pt-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Status card */}
        <div className="glass-card rounded-2xl p-8 text-center border border-white/10 bg-black/60 animate-slide-up">

          {isCompleted && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center animate-scale-in">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="font-display font-black text-white text-2xl tracking-tight mb-2">ORDER CONFIRMED 🎉</h1>
              <p className="font-body text-sm text-white/50">Payment received. Your order is being prepared.</p>
            </>
          )}

          {isFailed && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white/60" />
                </div>
              </div>
              <h1 className="font-display font-black text-white text-2xl tracking-tight mb-2">PAYMENT CANCELLED</h1>
              <p className="font-body text-sm text-white/50 mb-6">
                You cancelled the M-Pesa prompt or payment couldn't be processed. Your order is saved — retry below.
              </p>
              <button onClick={() => navigate("/checkout")} className="holo-btn rounded-xl px-6 py-3 text-sm font-display font-bold tracking-widest">
                TRY AGAIN
              </button>
            </>
          )}

          {isPending && timedOut && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/40 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
              <h1 className="font-display font-black text-white text-2xl tracking-tight mb-2">STILL WAITING…</h1>
              <p className="font-body text-sm text-white/50 mb-4">Payment confirmation hasn't arrived yet.</p>
              <ul className="text-xs text-white/40 font-body text-left inline-block mb-6 space-y-1.5">
                <li>• Cancelled M-Pesa prompt → <span className="text-white/70">Try Again</span></li>
                <li>• Already paid → <span className="text-white/70">keep this page open</span></li>
                <li>• Network issue → <span className="text-white/70">wait a few minutes</span></li>
              </ul>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => { setTimedOut(false); setSecondsLeft(120); refetch(); }}
                  className="holo-btn rounded-xl px-5 py-2.5 text-xs font-display tracking-widest flex items-center gap-2">
                  <RefreshCw size={12} /> KEEP WAITING
                </button>
                <button onClick={() => navigate("/checkout")} className="holo-btn rounded-xl px-5 py-2.5 text-xs font-display font-bold tracking-widest">
                  TRY AGAIN
                </button>
              </div>
              <p className="font-mono-cyber text-[10px] text-white/25 mt-4 tracking-wide">
                Order ID: {order.id.slice(0, 8).toUpperCase()}…
              </p>
            </>
          )}

          {isPending && !timedOut && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center animate-pulse">
                  <Clock className="w-10 h-10 text-white/50" style={{ animation: "spin 3s linear infinite" }} />
                </div>
              </div>
              <h1 className="font-display font-black text-white text-2xl tracking-tight mb-2">WAITING FOR PAYMENT</h1>
              <p className="font-body text-sm text-white/50 mb-1">Check your phone and enter your M-Pesa PIN.</p>
              <p className="font-mono-cyber text-[10px] text-white/25 mb-4 tracking-wide">This page updates automatically.</p>
              {isPendingPayment && (
                <div className="mb-4">
                  <div className="w-full bg-white/8 rounded-full h-1 mb-1.5">
                    <div className="bg-white/50 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${(secondsLeft / (TIMEOUT_MS / 1000)) * 100}%` }} />
                  </div>
                  <p className="font-mono-cyber text-[10px] text-white/25 tracking-wide">
                    Auto-checking every 5s · {secondsLeft}s remaining
                  </p>
                </div>
              )}
              <button onClick={() => refetch()} id="order-check-now-btn"
                className="holo-btn rounded-xl px-5 py-2 text-xs font-display tracking-widest flex items-center gap-2 mx-auto">
                <RefreshCw size={12} /> CHECK NOW
              </button>
            </>
          )}
        </div>

        {/* Order details */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-black/60 animate-slide-up space-y-4" style={{ animationDelay: "80ms" }}>
          <h2 className="font-display text-xs font-bold tracking-[0.25em] text-white/40 uppercase">Order Details</h2>
          <div>
            <p className="font-mono-cyber text-[10px] text-white/25 tracking-wider uppercase mb-0.5">Order ID</p>
            <p className="font-mono-cyber text-xs text-white/60 break-all">{order.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono-cyber text-[10px] text-white/25 tracking-wider uppercase mb-0.5">Email</p>
              <p className="font-body text-xs text-white/60 truncate">{order.email}</p>
            </div>
            <div>
              <p className="font-mono-cyber text-[10px] text-white/25 tracking-wider uppercase mb-0.5">Phone</p>
              <p className="font-body text-xs text-white/60">{order.phone_number}</p>
            </div>
          </div>
          {typeof order.shipping_address === "object" && (
            <div>
              <p className="font-mono-cyber text-[10px] text-white/25 tracking-wider uppercase mb-0.5">
                {order.delivery_method === "pickup" ? "Pickup Point" : "Ship To"}
              </p>
              <div className="font-body text-xs text-white/60 space-y-0.5">
                {order.delivery_method === "pickup" ? (
                  <p className="font-bold text-white uppercase">{order.pickup_point_id || "Hub Location"}</p>
                ) : (
                  <>
                    <p>{(order.shipping_address as any).street}</p>
                    <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).postalCode}</p>
                    <p>{(order.shipping_address as any).country}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-black/60 animate-slide-up space-y-4" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={13} className="text-electric-blue" />
            <h2 className="font-display text-xs font-bold tracking-[0.25em] text-white/40 uppercase">Items</h2>
          </div>
          <div className="space-y-3 divide-y divide-white/6">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center pt-3 first:pt-0">
                <div>
                  <p className="font-body text-xs font-medium text-white/70">{item.product_name}</p>
                  <p className="font-mono-cyber text-[10px] text-white/30 tracking-wide mt-0.5">{item.size} × {item.quantity}</p>
                </div>
                <span className="font-display text-sm font-semibold text-white/60">
                  KES {(item.product_price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-baseline border-t border-white/8 pt-4">
            <span className="font-display text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Total</span>
            <span className="font-display font-black text-white text-xl">KES {order.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "240ms" }}>
          {isCompleted && (
            <button onClick={() => navigate("/")} id="order-continue-btn"
              className="flex-1 holo-btn holo-btn-red rounded-xl py-3.5 text-xs font-display font-bold tracking-widest flex items-center justify-center gap-2">
              <ShoppingBag size={13} /> CONTINUE SHOPPING
            </button>
          )}
          <button onClick={() => window.print()} id="order-print-btn"
            className="flex-1 holo-btn rounded-xl py-3.5 text-xs font-display tracking-widest flex items-center justify-center gap-2">
            <Printer size={13} /> PRINT ORDER
          </button>
        </div>

        {isCompleted && (
          <div className="glass-card rounded-xl p-4 border border-matrix-green/20 bg-matrix-green/5 animate-scale-in">
            <p className="font-mono-cyber text-[11px] text-matrix-green/80 tracking-wide">
              ✓ Confirmation sent to <strong className="text-matrix-green">{order.email}</strong>. Tracking info arrives once your order ships.
            </p>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 border border-white/8 flex items-start gap-2.5 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <Phone size={12} className="text-white/20 flex-shrink-0 mt-0.5" />
          <p className="font-mono-cyber text-[10px] text-white/25 tracking-wide leading-relaxed">
            Need help? Save order ID <span className="text-white/40">{order.id.slice(0, 8).toUpperCase()}…</span> and contact support.
            Payment is confirmed automatically — do not refresh while waiting.
          </p>
        </div>

      </div>
    </main>
  );
}
