import { CartItem } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { ShippingAddress } from "@/validations/schemas";
import { Truck, ShoppingBag, Lock, Shield } from "lucide-react";

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  shippingAddress?: ShippingAddress;
}

function calculateShipping(address?: ShippingAddress): { cost: number; description: string } {
  if (!address) return { cost: 0, description: "Calculated at next step" };
  const city = address.city.toLowerCase().trim();
  if (["cbd", "central business district", "downtown nairobi"].some((a) => city.includes(a)))
    return { cost: 0, description: "Free · CBD Nairobi" };
  if (city === "nairobi" || city.includes("nairobi"))
    return { cost: 200, description: "KES 200 · Nairobi" };
  return { cost: 300, description: "KES 300 · Outside Nairobi" };
}

export function OrderSummary({ items, totalPrice, shippingAddress }: OrderSummaryProps) {
  const { cost: shippingCost, description: shippingDesc } = calculateShipping(shippingAddress);
  const totalWithShipping = totalPrice + shippingCost;

  return (
    <div className="glass-card rounded-2xl p-5 sticky top-28 border border-white/10 bg-black/70">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/8">
        <ShoppingBag size={14} className="text-electric-blue" />
        <h2 className="font-display text-xs font-bold tracking-[0.25em] text-white/60 uppercase">
          Order Summary
        </h2>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-5 pb-5 border-b border-white/8 max-h-56 overflow-y-auto">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.size}`}
            className="flex justify-between gap-3"
          >
            <div className="flex gap-2.5 min-w-0">
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-lg object-cover bg-neutral-800 flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-body text-xs font-medium text-white/70 truncate leading-snug">
                  {item.product.name}
                </p>
                <p className="font-mono-cyber text-[10px] text-white/30 tracking-wide">
                  {item.size} × {item.quantity}
                </p>
              </div>
            </div>
            <span className="font-display text-xs font-semibold text-white/60 flex-shrink-0">
              {formatPrice(item.product.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-2.5 mb-5 pb-5 border-b border-white/8">
        <div className="flex justify-between">
          <span className="font-body text-xs text-white/40">Subtotal</span>
          <span className="font-display text-xs text-white/60">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Truck size={11} className={shippingCost === 0 && shippingAddress ? "text-matrix-green" : "text-white/20"} />
            <span className="font-body text-xs text-white/40">Shipping</span>
          </div>
          <span className={`font-mono-cyber text-xs ${shippingCost === 0 && shippingAddress ? "text-matrix-green" : "text-white/30"}`}>
            {shippingDesc}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-baseline mb-6">
        <span className="font-display text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Total</span>
        <span className="font-display font-black text-white text-xl">
          {formatPrice(totalWithShipping)}
        </span>
      </div>

      {/* Trust indicators */}
      <div className="space-y-2">
        {[
          { icon: Lock,   text: "Secure M-Pesa payment" },
          { icon: Shield, text: "Order confirmation via email" },
          { icon: Truck,  text: "2–3 business days delivery" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon size={10} className="text-matrix-green flex-shrink-0" />
            <span className="font-mono-cyber text-[10px] text-white/25 tracking-wide">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
