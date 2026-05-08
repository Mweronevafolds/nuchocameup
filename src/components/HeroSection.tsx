import { useNavigate } from "react-router-dom";
import { ArrowRight, Package, Truck, ShieldCheck } from "lucide-react";
import MagneticElement from "@/components/MagneticElement";

const STATS = [
  { icon: Package, label: "Premium",  value: "Quality", color: "#FAFAFA" },
  { icon: Truck,   label: "Delivery", value: "Fast",    color: "#FAFAFA" },
  { icon: ShieldCheck, label: "Secure", value: "Checkout", color: "#FAFAFA" },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="relative w-full overflow-hidden bg-void-black text-white"
      style={{ minHeight: "min(90vh, 700px)" }}
      aria-label="Hero"
    >
      {/* Brutalist structural background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none cross-hatch-pattern"></div>
      
      {/* Central focal glow (monochrome) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 80%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 gap-8 max-w-screen-md mx-auto">

        {/* Pre-headline chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 animate-slide-up">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-mono-cyber text-[10px] text-white/80 tracking-[0.3em] uppercase">
            Foreva Fly · Est. 2024
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="font-display font-black text-white leading-[0.9] tracking-tighter animate-slide-up"
          style={{
            fontSize: "clamp(3.5rem, 12vw, 8rem)",
            animationDelay: "80ms",
            textTransform: "uppercase"
          }}
        >
          2FLY
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-400 to-neutral-600">
            DAILY
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="font-body text-neutral-400 text-base md:text-lg max-w-sm leading-relaxed animate-slide-up"
          style={{ animationDelay: "160ms" }}
        >
          Premium streetwear that moves with you.
          <br />
          Designed for now. Built for tomorrow.
        </p>

        {/* CTA buttons with Magnetic Effect */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 animate-slide-up mt-4"
          style={{ animationDelay: "240ms" }}
        >
          <MagneticElement amount={0.3}>
            <button
              id="hero-shop-cta"
              onClick={() => navigate("/?sort=newest#shop")}
              className="group relative flex items-center gap-2 rounded-xl bg-white text-black px-8 py-4 text-sm font-display font-bold tracking-widest hover:bg-neutral-200 transition-colors"
            >
              SHOP NOW
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </MagneticElement>

          <MagneticElement amount={0.2}>
            <button
              id="hero-new-drops-cta"
              onClick={() => navigate("/?sort=newest#shop")}
              className="flex items-center gap-2 rounded-xl bg-transparent border border-white/20 text-white px-8 py-4 text-sm font-display font-bold tracking-widest hover:bg-white/10 transition-colors"
            >
              NEW DROPS
            </button>
          </MagneticElement>
        </div>

        {/* Floating stats */}
        <div
          className="flex flex-wrap justify-center gap-3 animate-slide-up mt-6"
          style={{ animationDelay: "320ms" }}
        >
          {STATS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="glass-card rounded-xl px-5 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors duration-300 border border-white/10"
            >
              <Icon size={15} className="text-white/60" />
              <div className="text-left">
                <div className="font-display font-bold text-sm leading-none text-white">
                  {value}
                </div>
                <div className="font-mono-cyber text-[9px] text-white/40 tracking-widest uppercase mt-0.5">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom transition into light product grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-10"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(0,0%,98%))" }}
      />
    </section>
  );
}
