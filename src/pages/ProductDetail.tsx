import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Check, Truck, RefreshCw, ChevronDown, Package } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useProduct } from "@/hooks/useProducts";
import { useAiRecommendations } from "@/hooks/useAiRecommendations";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

export default function ProductDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: recommendations, isLoading: recsLoading } = useAiRecommendations(id);
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added,        setAdded]        = useState(false);
  const [sizeError,    setSizeError]    = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);

  /* ── Loading state ─────────────────────────────────── */
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black pb-16">
        <div className="max-w-screen-xl mx-auto px-4 pt-6">
          <Skeleton className="h-4 w-20 bg-white/10 rounded mb-8" />
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
            <Skeleton className="aspect-square w-full rounded-xl bg-white/5" />
            <div className="space-y-5 pt-8 lg:pt-0">
              <Skeleton className="h-8 w-3/4 bg-white/10 rounded" />
              <Skeleton className="h-10 w-1/3 bg-white/10 rounded" />
              <Skeleton className="h-24 w-full bg-white/5 rounded" />
              <div className="flex gap-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-10 bg-white/10 rounded" />)}
              </div>
              <Skeleton className="h-14 w-full bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Not found ─────────────────────────────────────── */
  if (!product) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="font-display text-white/40 text-lg">Product not found</p>
        <button onClick={() => navigate("/")} className="holo-btn rounded-lg px-6 py-3 text-sm font-display tracking-widest">
          Back to Shop
        </button>
      </main>
    );
  }

  const cartProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price,
    image: product.image_url || "",
    soldOut: product.sold_out,
    sizes: product.sizes,
    description: product.description,
  };

  const discount =
    product.original_price && product.price < product.original_price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1500);
      return;
    }
    addItem(cartProduct, selectedSize);
    setAdded(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#FFFFFF", "#D1D5DB", "#0A0A0A"]
    });
    setTimeout(() => setAdded(false), 2500);
  };

  const accordionItems = [
    {
      id: "shipping",
      icon: Truck,
      title: "Shipping & Delivery",
      content: "CBD Nairobi — FREE · Nairobi — KES 200 · Outside Nairobi — KES 300. Estimated delivery 2–3 business days.",
    },
    {
      id: "details",
      icon: Package,
      title: "Product Details",
      content: product.description || "Premium quality streetwear crafted for everyday wear. Designed in Nairobi.",
    },
  ];

  return (
    <main className="min-h-screen bg-black pb-24">
      {/* Top nav bar */}
      <div className="sticky top-[60px] z-30 bg-black/80 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono-cyber text-white/35 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={13} />
            Shop
          </Link>
          <span className="text-white/15 font-mono-cyber text-xs">/</span>
          <span className="text-xs font-mono-cyber text-white/40 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pt-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">

          {/* ── Product Image ─────────────────────────────── */}
          <div className="relative">
            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded-md bg-white text-black text-[10px] font-display font-black tracking-widest uppercase">
                SAVE {discount}%
              </div>
            )}

            <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-900 group cursor-zoom-in">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono-cyber text-white/20 text-sm tracking-widest">
                  NO IMAGE
                </div>
              )}
            </div>

            {/* Ambient glow under image */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 blur-2xl opacity-20"
              style={{ background: "radial-gradient(ellipse, #00F0FF, transparent)" }}
            />
          </div>

          {/* ── Product Info ──────────────────────────────── */}
          <div className="space-y-6 pt-8 lg:pt-0 lg:sticky lg:top-28">

            {/* Name */}
            <div>
              <h1 className="font-display font-black text-white leading-tight tracking-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-3">
                <span
                  className="font-display font-black text-white"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                >
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.price < product.original_price && (
                  <span className="text-lg text-white/30 line-through font-body">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Short description */}
            {product.description && (
              <p className="font-body text-sm text-white/50 leading-relaxed border-l-2 border-white/10 pl-4">
                {product.description}
              </p>
            )}

            {/* Size selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">
                  Select Size
                </span>
                <button className="font-mono-cyber text-[10px] text-white/50 hover:text-white transition-colors tracking-wide">
                  Size Guide →
                </button>
              </div>
              {sizeError && (
                <p className="font-mono-cyber text-[10px] text-white/50 mb-2 tracking-wide animate-scale-in">
                  ↑ Please select a size
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    id={`size-${size}`}
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`size-chip ${selectedSize === size ? "selected" : ""}`}
                  >
                    {size}
                    {selectedSize === size && (
                      <Check size={10} className="ml-1 text-black animate-scale-in" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart CTA */}
            <button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.sold_out}
              className={`w-full flex items-center justify-center gap-3 rounded-xl py-4 font-display font-bold text-sm tracking-[0.15em] transition-all duration-300 ${
                product.sold_out
                  ? "bg-white/5 text-white/20 border border-white/8 cursor-not-allowed"
                  : added
                  ? "bg-white text-black cyber-glow-green"
                  : "holo-btn"
              }`}
            >
              {product.sold_out ? (
                "SOLD OUT"
              ) : added ? (
                <>
                  <Check size={16} className="animate-scale-in" />
                  ADDED TO BAG
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  ADD TO BAG
                </>
              )}
            </button>

            {/* Trust row */}
            <div className="flex items-center justify-around py-3 border-y border-white/8">
              {[
                { icon: Truck,      label: "Fast Delivery" },
                { icon: Package,    label: "Quality Made"  },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon size={14} className="text-white/30" />
                  <span className="font-display font-medium text-[10px] uppercase tracking-wider text-white">{label}</span>
                </div>
              ))}
            </div>

            {/* Accordion details */}
            <div className="space-y-2">
              {accordionItems.map(({ id, icon: Icon, title, content }) => (
                <div
                  key={id}
                  className="border border-white/8 rounded-xl overflow-hidden"
                >
                  <button
                    id={`accordion-${id}`}
                    onClick={() => setAccordionOpen(accordionOpen === id ? null : id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/4 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className="text-white/60" />
                      <span className="font-display text-xs font-semibold text-white/70 tracking-wide">{title}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-white/30 transition-transform duration-300 ${accordionOpen === id ? "rotate-180" : ""}`}
                    />
                  </button>
                  {accordionOpen === id && (
                    <div className="px-4 pb-4 animate-slide-up">
                      <p className="font-body text-xs text-white/40 leading-relaxed">{content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Style Recommendations - COMPLETE THE FIT */}
      <div className="max-w-screen-xl mx-auto px-4 mt-20 fade-in-section pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="font-display font-black text-2xl tracking-tighter text-white flex items-center gap-3 uppercase">
              🎯 Complete The Fit 
              <span className="px-2.5 py-0.5 rounded text-[10px] bg-gradient-to-r from-electric-blue/30 to-purple/30 border border-electric-blue/50 tracking-widest text-white/80 font-mono-cyber animate-pulse">AI Match</span>
            </h2>
            <p className="font-body text-sm text-neutral-400 mt-1">Stylist picks that GO HARD with this piece →</p>
          </div>
        </div>

        {recsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl bg-white/5" />
                <Skeleton className="h-3 w-3/4 rounded bg-white/5" />
                <Skeleton className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((rec, idx) => (
              <div key={rec.id} className="group relative">
                {/* Fire indicator badge */}
                <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  🔥
                </div>
                <ProductCard product={rec} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 border border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-4 animate-bounce">🤖</span>
            <h3 className="font-display font-bold text-white mb-2">Stylist Rebooting...</h3>
            <p className="font-body text-sm text-neutral-400 max-w-sm">Can't match right now. Try again in a sec!</p>
          </div>
        )}
      </div>
    </main>
  );
}
