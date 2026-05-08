import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ArrowLeft, MapPin, Smartphone, Check, ShoppingBag } from "lucide-react";
import { useCheckout } from "@/hooks/useCheckout";
import { ShippingAddress } from "@/validations/schemas";

type CheckoutStep = "shipping" | "payment";

function calculateShipping(address: ShippingAddress): number {
  const city = address.city.toLowerCase().trim();
  if (["cbd", "central business district", "downtown nairobi"].some((a) => city.includes(a))) return 0;
  if (city === "nairobi" || city.includes("nairobi")) return 200;
  return 300;
}

const STEPS = [
  { key: "shipping" as const, label: "Shipping", icon: MapPin },
  { key: "payment" as const, label: "Payment", icon: Smartphone },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();
  const { toast } = useToast();
  const { createOrder, isLoading } = useCheckout();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [shippingData, setShippingData] = useState<ShippingAddress>({
    fullName: "", email: "", phoneNumber: "",
    street: "", city: "", postalCode: "", country: "Kenya",
  });

  /* ── Empty cart ────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-float">
          <ShoppingBag size={24} className="text-white/25" />
        </div>
        <div>
          <p className="font-display font-bold text-white/60 text-lg tracking-wide mb-1">
            YOUR BAG IS EMPTY
          </p>
          <p className="font-body text-sm text-white/30">Add some pieces before checking out.</p>
        </div>
        <button
          onClick={() => navigate("/")}
          id="checkout-continue-shopping-btn"
          className="holo-btn rounded-xl px-8 py-3.5 text-sm font-display tracking-widest"
        >
          CONTINUE SHOPPING
        </button>
      </main>
    );
  }

  const handleShippingSubmit = (data: ShippingAddress) => {
    setShippingData(data);
    setCurrentStep("payment");
  };

  const handlePaymentSubmit = async (email: string) => {
    const shippingCost = calculateShipping(shippingData);
    const order = await createOrder({
      phoneNumber: shippingData.phoneNumber,
      email: email,
      shippingAddress: {
        street: shippingData.street,
        city: shippingData.city,
        postalCode: shippingData.postalCode,
        country: "Kenya",
      },
      totalAmount: totalPrice + shippingCost,
      currency: "KES",
      paymentMethod: "PAYSTACK",
    });

    if (!order.authorization_url) {
      throw new Error("Missing Paystack authorization URL");
    }

    return { authorization_url: order.authorization_url };
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <main className="min-h-screen bg-black pb-16">

      {/* Back link */}
      <div className="sticky top-[60px] z-30 bg-black/80 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            id="checkout-back-btn"
            className="inline-flex items-center gap-1.5 text-xs font-mono-cyber text-white/35 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Shop
          </button>

          <div className="flex-1" />

          {/* Step progress — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map(({ key, label, icon: Icon }, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono-cyber tracking-wide transition-all duration-300 ${done ? "bg-matrix-green/10 border border-matrix-green/30 text-matrix-green" :
                      current ? "bg-electric-blue/10 border border-electric-blue/30 text-electric-blue" :
                        "border border-white/10 text-white/20"
                    }`}>
                    {done
                      ? <Check size={10} />
                      : <Icon size={10} />
                    }
                    {label.toUpperCase()}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px w-6 transition-colors duration-300 ${done ? "bg-matrix-green/40" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 pt-8">
        {/* Mobile step indicator */}
        <div className="sm:hidden flex items-center justify-center gap-3 mb-6">
          {STEPS.map(({ key, label }, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono-cyber tracking-wide transition-all duration-300 ${done ? "bg-matrix-green/10 border border-matrix-green/30 text-matrix-green" :
                    current ? "bg-electric-blue/10 border border-electric-blue/30 text-electric-blue" :
                      "border border-white/10 text-white/20"
                  }`}>
                  {done ? <Check size={10} /> : null}
                  {label.toUpperCase()}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-4 ${done ? "bg-matrix-green/40" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form column */}
          <div className="lg:col-span-2 animate-slide-up">
            {currentStep === "shipping" && (
              <ShippingForm
                onSubmit={handleShippingSubmit}
                defaultValues={shippingData}
                onBack={() => navigate("/")}
              />
            )}
            {currentStep === "payment" && (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                isLoading={isLoading}
                onBack={() => setCurrentStep("shipping")}
              />
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1 animate-slide-right" style={{ animationDelay: "100ms" }}>
            <OrderSummary
              items={items}
              totalPrice={totalPrice}
              shippingAddress={currentStep !== "shipping" ? shippingData : undefined}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
