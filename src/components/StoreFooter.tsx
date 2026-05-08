import { Instagram, Twitter, Facebook, Mail, MapPin, Phone, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StoreFooter() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      toast.error("Add an email or phone number.");
      return;
    }

    let normalizedPhone: string | null = null;
    if (trimmedPhone) {
      normalizedPhone = trimmedPhone.replace(/^0/, "254").replace(/^\+/, "");
      if (!normalizedPhone.startsWith("254")) {
        normalizedPhone = "254" + normalizedPhone;
      }
      if (!/^(?:254)[17]\d{8}$/.test(normalizedPhone)) {
        toast.error("Enter a valid Kenyan phone number.");
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert([
          {
            email: trimmedEmail || null,
            phone_number: normalizedPhone,
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already in the loop!");
          setSubscribed(true);
        } else {
          toast.error("Subscription failed. Try again.");
        }
        return;
      }

      setSubscribed(true);
      setEmail("");
      setPhone("");
      toast.success("Welcome to the crew!");
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  return (
    <footer className="relative bg-black border-t border-white/8 overflow-hidden">

      {/* Subtle animated grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-12 space-y-10">

        {/* Brand mark */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
            2FLY<span className="text-white/50">®</span> DAILY
          </h2>
          <p className="text-xs font-mono-cyber text-white/30 tracking-[0.35em] uppercase">
            FOREVA FLY · EST. 2024
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {["●", "●", "●"].map((dot, i) => (
              <span
                key={i}
                className="text-[6px]"
                style={{
                  color: ["#FFFFFF", "#AAAAAA", "#555555"][i],
                  filter: `drop-shadow(0 0 4px ${["#FFFFFF", "#AAAAAA", "#555555"][i]})`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                {dot}
              </span>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="glass-card rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-white" />
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              STAY IN THE KNOW
            </h3>
          </div>
          <p className="text-xs text-white/40 mb-4 font-body">
            New drops, exclusive deals, and vibes — straight to your inbox or phone.
          </p>

          {subscribed ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-white/10 border border-white/30 rounded-lg animate-scale-in">
              <span className="text-white text-sm font-display font-semibold tracking-wide">
                ✓ YOU'RE IN. STAY FLY.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm cyber-input"
                  id="footer-email-input"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm cyber-input"
                  id="footer-phone-input"
                />
              </div>
              <button
                type="submit"
                id="footer-subscribe-btn"
                className="w-full holo-btn px-4 py-2.5 rounded-lg text-xs font-display font-semibold tracking-widest whitespace-nowrap"
              >
                JOIN THE CREW
              </button>
            </form>
          )}
        </div>

        {/* Shipping info */}
        <div className="glass-card rounded-xl p-4 max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <Truck size={16} className="text-white mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1.5">
              <h3 className="font-display font-semibold text-white/80 tracking-wide text-xs uppercase">
                Delivery Rates — Kenya
              </h3>
              <ul className="text-xs text-white/40 space-y-1 font-body">
                <li className="flex justify-between gap-6">
                  <span className="text-white/60">CBD Nairobi</span>
                  <span className="font-mono-cyber text-white">FREE</span>
                </li>
                <li className="flex justify-between gap-6">
                  <span className="text-white/60">Nairobi</span>
                  <span className="font-mono-cyber text-white/50">KES 200</span>
                </li>
                <li className="flex justify-between gap-6">
                  <span className="text-white/60">Outside Nairobi</span>
                  <span className="font-mono-cyber text-white/50">KES 300</span>
                </li>
              </ul>
              <p className="text-[11px] text-white/25 pt-1">2–3 business days delivery</p>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-lg mx-auto text-sm">
          <div className="space-y-3">
            <h3 className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-white/25">Shop</h3>
            <ul className="space-y-2.5 text-white/50 font-body">
              {["New Arrivals", "Hoodies", "Tees", "Croptops"].map((item) => (
                <li key={item}>
                  <Link to="/" className="hover:text-white transition-colors duration-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-white/25">Help</h3>
            <ul className="space-y-2.5 text-white/50 font-body">
              {["Shipping", "Track Order", "Size Guide", "FAQs"].map((item) => (
                <li key={item}>
                  <Link to={item === "Track Order" ? "/track" : "/"} className="hover:text-white transition-colors duration-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-white/25">Contact</h3>
            <ul className="space-y-2.5 text-white/50 font-body text-xs">
              <li className="flex items-center gap-2"><Mail size={12} className="text-white/60" /> info@2flydaily.com</li>
              <li className="flex items-center gap-2"><Phone size={12} className="text-white/60" /> +254 700 000 000</li>
              <li className="flex items-center gap-2"><MapPin size={12} className="text-white/60" /> Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        {/* Socials */}
        <div className="flex justify-center gap-4">
          {[
            { href: "https://instagram.com", label: "Instagram", icon: Instagram },
            { href: "https://twitter.com",   label: "Twitter",   icon: Twitter   },
            { href: "https://facebook.com",  label: "Facebook",  icon: Facebook  },
          ].map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="p-2 rounded-lg border border-white/8 text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-white/20 font-mono-cyber">
          <span>© {new Date().getFullYear()} 2FLY® Daily. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-white/40 transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-white/40 transition-colors">Terms</Link>
            <Link to="/admin/login" className="hover:text-white/40 transition-colors">[admin]</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
