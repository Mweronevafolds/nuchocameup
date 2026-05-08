import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader, Lock, ArrowRight, CreditCard, Check } from "lucide-react";
import { getPaystackPublicKey } from "@/integrations/paystack/client";

interface PaymentFormProps {
  onSubmit: (email: string) => Promise<{ authorization_url: string }>;
  isLoading?: boolean;
  onBack: () => void;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaymentForm({ onSubmit, isLoading = false, onBack }: PaymentFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePaystackPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsInitializing(true);

    if (!email.trim()) {
      setError("Email address is required");
      setIsInitializing(false);
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsInitializing(false);
      return;
    }

    try {
      const response = await onSubmit(email);

      // Redirect to Paystack authorization URL
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment initiation failed";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-black/60">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
        <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center">
          <CreditCard size={13} className="text-electric-blue" />
        </div>
        <div>
          <h2 className="font-display text-sm font-bold text-white tracking-wide">Secure Payment</h2>
          <p className="font-mono-cyber text-[10px] text-white/30 tracking-wide mt-0.5">
            Powered by Paystack
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 space-y-2.5">
        <h3 className="font-display text-xs font-bold text-white/80 tracking-wide">
          How it works
        </h3>
        {[
          "Enter your email address",
          "You'll be redirected to Paystack",
          "Complete your card payment securely",
          "Order confirmation appears instantly",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="font-mono-cyber text-[10px] text-white/40 flex-shrink-0 w-4">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-body text-xs text-white/50 leading-relaxed">{step}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handlePaystackPayment} className="space-y-4">
        <div className="space-y-2">
          <label className="font-display text-xs font-bold text-white tracking-wider uppercase">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            disabled={isLoading || isInitializing}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 font-body text-sm focus:outline-none focus:border-electric-blue/50 focus:bg-white/10 transition-all disabled:opacity-50"
          />
          {error && <p className="text-red-500 font-mono-cyber text-[10px]">{error}</p>}
        </div>

        <p className="font-mono-cyber text-[10px] text-white/25 tracking-wide">
          Supports all major debit & credit cards worldwide
        </p>

        <div className="flex items-center justify-center gap-2 py-3 border-y border-white/6 mt-6 pt-6">
          <Lock size={10} className="text-white/25" />
          <span className="font-mono-cyber text-[10px] text-white/25 tracking-widest uppercase">
            256-Bit Encrypted · PCI-DSS Compliant
          </span>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading || isInitializing}
            id="payment-back-btn"
            className="flex-1 holo-btn rounded-xl py-3.5 text-xs font-display tracking-widest disabled:opacity-30"
          >
            BACK
          </button>
          <button
            type="submit"
            disabled={isLoading || isInitializing}
            id="payment-submit-btn"
            className="flex-[2] bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-display font-bold tracking-widest disabled:opacity-50"
          >
            {isLoading || isInitializing ? (
              <><Loader size={13} className="animate-spin" /> PROCESSING...</>
            ) : (
              <>PAY WITH PAYSTACK <ArrowRight size={13} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
