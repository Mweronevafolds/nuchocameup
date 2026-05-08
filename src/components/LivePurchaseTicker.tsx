import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, X } from "lucide-react";

interface PurchaseEvent {
  id: number;
  location: string;
  product: string;
  time: string;
}

const POOL: Omit<PurchaseEvent, "id">[] = [
  { location: "Nairobi, CBD",     product: "Essential Crop Hoodie",  time: "2m ago"  },
  { location: "Westlands",        product: "Oversized Tee — Black",   time: "5m ago"  },
  { location: "Kilimani",         product: "Ribbed Crop Top",         time: "8m ago"  },
  { location: "Karen",            product: "Classic Hoodie — Grey",   time: "11m ago" },
  { location: "Ngong Road",       product: "Essential Crop Hoodie",   time: "14m ago" },
  { location: "South B",          product: "Fleece Joggers",          time: "18m ago" },
  { location: "Lavington",        product: "Oversized Tee — White",   time: "22m ago" },
  { location: "Parklands",        product: "Crop Zip Hoodie",         time: "25m ago" },
  { location: "Mombasa",          product: "Summer Tee — Navy",       time: "30m ago" },
  { location: "Kisumu",           product: "Essential Crop Hoodie",   time: "35m ago" },
];

let counter = 0;

export function LivePurchaseTicker() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [event, setEvent] = useState<PurchaseEvent | null>(null);

  const showNext = useCallback(() => {
    const item = POOL[counter % POOL.length];
    counter++;
    setEvent({ ...item, id: counter });
    setVisible(true);

    // Auto-dismiss after 5s
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    if (dismissed) return;

    // Initial delay before first notification
    const initial = setTimeout(showNext, 6000);
    // Then cycle every 12s
    const interval = setInterval(() => {
      if (!dismissed) showNext();
    }, 12000);

    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [dismissed, showNext]);

  if (dismissed || !event) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-4 z-50 max-w-[280px] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0 animate-ticker-in" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="glass-dark rounded-xl p-3.5 flex items-start gap-3 border border-white/12">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <ShoppingBag size={13} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-[11px] text-white/70 leading-snug">
            <span className="font-semibold text-white/90">{event.location}</span>
            {" just bought "}
            <span className="text-white/80 font-medium italic">{event.product}</span>
          </p>
          <p className="font-mono-cyber text-[9px] text-white/25 tracking-wide mt-0.5">
            {event.time} · Verified purchase
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => { setVisible(false); setDismissed(true); }}
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors p-0.5"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
