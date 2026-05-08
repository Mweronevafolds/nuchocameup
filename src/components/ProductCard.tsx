import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/products";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useCart } from "@/context/CartContext";
import confetti from "canvas-confetti";
import type { DbProduct } from "@/hooks/useProducts";

interface ProductCardProps {
  product: DbProduct;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /* Intersection Observer for stagger-fade entrance */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "40px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.sold_out || !product.sizes?.length) return;

    // Pick first available size for quick add
    const size = product.sizes[0];
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        image: product.image_url || "",
        soldOut: product.sold_out,
        sizes: product.sizes,
        description: product.description,
      },
      size
    );
    setAddedSize(size);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#FFFFFF", "#D1D5DB", "#0A0A0A"]
    });
    setTimeout(() => setAddedSize(null), 2000);
  };

  const discount =
    product.original_price && product.price < product.original_price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0;

  const isLowStock = !product.sold_out && (product.stock_quantity ?? 99) <= 5;

  return (
    <div
      ref={cardRef}
      className="group relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s cubic-bezier(0.33,1,0.68,1) ${index * 60}ms, transform 0.5s cubic-bezier(0.33,1,0.68,1) ${index * 60}ms`,
      }}
    >
      <Link to={`/product/${product.id}`} className="block" aria-label={product.name}>
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100 rounded-lg">
          {product.image_url ? (
            <OptimizedImage
              src={product.image_url}
              alt={product.name}
              width={400}
              height={400}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              style={{ transform: "scale(1)", transition: "transform 700ms cubic-bezier(0.33,1,0.68,1)" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400 text-xs font-mono-cyber tracking-widest">
              NO IMAGE
            </div>
          )}

          {/* Holographic sweep overlay */}
          <div className="absolute inset-0 holo-sweep pointer-events-none rounded-lg" />

          {/* Sold out overlay */}
          {product.sold_out && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
              <span className="font-display font-bold text-xs tracking-[0.3em] text-white/60 uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && !product.sold_out && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-white text-black text-[10px] font-display font-bold tracking-wide">
              -{discount}%
            </div>
          )}

          {/* Low stock badge */}
          {isLowStock && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-md stock-badge text-matrix-green border border-matrix-green/40 bg-black/70 animate-pulse-glow">
              {product.stock_quantity ?? "FEW"} LEFT
            </div>
          )}

          {/* Quick-add button — slides up from bottom */}
          {!product.sold_out && (
            <button
              id={`quick-add-${product.id}`}
              onClick={handleQuickAdd}
              aria-label={`Quick add ${product.name}`}
              className="quick-add-btn absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-black/90 backdrop-blur-sm text-white text-xs font-display font-semibold tracking-widest py-3.5 hover:bg-white hover:text-black transition-colors duration-200 rounded-b-lg border-t border-white/10"
            >
              {addedSize ? (
                <span className="text-matrix-green tracking-wider animate-scale-in">✓ ADDED TO BAG</span>
              ) : (
                <>
                  <ShoppingBag size={13} />
                  QUICK ADD
                </>
              )}
            </button>
          )}

          {/* View detail hint */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {!isLowStock && (
              <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                <Eye size={12} className="text-white/70" />
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className="mt-2.5 px-0.5 space-y-1">
          <h3 className="font-body text-[13px] font-medium text-neutral-800 leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm font-semibold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.price < product.original_price && (
              <span className="text-xs text-neutral-400 line-through font-body">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Size dots */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.sizes.map((size: string) => (
                <span
                  key={size}
                  className="text-[9px] font-mono-cyber text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded"
                >
                  {size}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
