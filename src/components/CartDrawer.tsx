import { X, Minus, Plus, ShoppingBag, ArrowRight, Lock, Truck, RefreshCw, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice } = useCart();

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const progress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        className="flex w-full flex-col sm:max-w-md p-0 bg-neutral-950 border-l border-white/10 shadow-[#000_-20px_0_60px]"
        style={{ backdropFilter: "blur(40px)" }}
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-white/8 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <ShoppingBag size={17} className="text-white/60" />
            <SheetTitle className="font-display text-sm font-bold tracking-[0.2em] text-white uppercase">
              Your Bag
            </SheetTitle>
            <SheetDescription className="sr-only">
              Your shopping cart contents and checkout options.
            </SheetDescription>
            {items.length > 0 && (
              <span className="font-mono-cyber text-[10px] text-electric-blue border border-electric-blue/30 bg-electric-blue/8 px-2 py-0.5 rounded-full animate-pulse-glow">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/8 flex items-center justify-center animate-float">
              <ShoppingBag size={24} className="text-white/25" />
            </div>
            <div>
              <p className="font-display font-bold text-white/60 tracking-wide mb-1">
                YOUR BAG IS WAITING
              </p>
              <p className="font-body text-xs text-white/25 leading-relaxed">
                Start building your rotation.
                <br />Every drop is a vibe check.
              </p>
            </div>
            <button
              onClick={() => { closeCart(); navigate("/?sort=newest#shop"); }}
              id="cart-start-shopping-btn"
              className="holo-btn rounded-lg px-6 py-2.5 text-xs font-display tracking-widest"
            >
              SHOP NOW
            </button>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">

              {/* Free shipping progress */}
              <div className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className={progress >= 100 ? "text-matrix-green" : "text-white/30"} />
                    <span className="font-mono-cyber text-[10px] text-white/40 tracking-wide">
                      {progress >= 100 ? "FREE SHIPPING UNLOCKED 🎉" : `KES ${remaining.toLocaleString()} away from free shipping`}
                    </span>
                  </div>
                  <span className="font-mono-cyber text-[10px] text-white/25">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full shipping-progress rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Cart items */}
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="group flex gap-3 border-b border-white/6 pb-4 last:border-0 animate-slide-right"
                >
                  {/* Product image */}
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono-cyber text-white/15 text-[8px]">
                        NO IMG
                      </div>
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-body text-xs font-medium text-white/80 leading-snug truncate">
                          {item.product.name}
                        </h4>
                        <p className="font-mono-cyber text-[10px] text-white/30 mt-0.5 tracking-wide">
                          Size {item.size}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, item.size)}
                        aria-label={`Remove ${item.product.name}`}
                        className="flex-shrink-0 p-1 rounded text-white/20 hover:text-cyber-red hover:bg-cyber-red/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="font-mono-cyber text-xs text-white/70 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex h-7 w-7 items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Line price */}
                      <span className="font-display text-sm font-bold text-white">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer summary */}
            <div className="border-t border-white/8 px-5 py-5 space-y-4 bg-black/50">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-white/40">Subtotal</span>
                <span className="font-display text-sm font-semibold text-white/80">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-xs text-white/30">Shipping</span>
                <span className="font-mono-cyber text-xs text-white/30">
                  {progress >= 100 ? <span className="text-matrix-green">FREE</span> : "Calculated at checkout"}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline border-t border-white/8 pt-4">
                <span className="font-display text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">Total</span>
                <span
                  className="font-display font-black text-white"
                  style={{ fontSize: "1.5rem" }}
                >
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button onClick={() => navigate("/checkout")} className="w-full holo-btn rounded-xl py-4 flex items-center justify-center gap-3 text-sm font-bold tracking-widest mt-6">
                PROCEED TO CHECKOUT
                <ArrowRight size={15} />
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 pt-1">
                {[
                  { icon: Lock,      label: "Secure" },
                  { icon: Truck,     label: "Fast Ship" },
                  { icon: RefreshCw, label: "Returns" },
                  { icon: Shield,    label: "Protected" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <Icon size={11} className="text-white/20" />
                    <span className="font-mono-cyber text-[8px] text-white/20 tracking-widest">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
