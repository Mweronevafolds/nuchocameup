import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shippingAddressSchema, type ShippingAddress } from "@/validations/schemas";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FuturisticInput } from "@/components/FuturisticInput";
import { User, Mail, Phone, MapPin, Building, Hash, Globe, ArrowRight, Truck, Store } from "lucide-react";
import { PICKUP_POINTS } from "@/data/deliveryPoints";

interface ShippingFormProps {
  onSubmit: (data: ShippingAddress) => void;
  defaultValues?: Partial<ShippingAddress>;
  onBack: () => void;
}

export function ShippingForm({ onSubmit, defaultValues, onBack }: ShippingFormProps) {
  const form = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: { country: "Kenya", ...defaultValues },
  });

  const fields = [
    { name: "fullName" as const, label: "Full Name", type: "text", icon: <User size={14} />, placeholder: "John Doe" },
    { name: "email" as const, label: "Email Address", type: "email", icon: <Mail size={14} />, placeholder: "john@example.com" },
    { name: "phoneNumber" as const, label: "Phone Number", type: "tel", icon: <Phone size={14} />, placeholder: "0712345678" },
    { name: "street" as const, label: "Street Address", type: "text", icon: <MapPin size={14} />, placeholder: "123 Main Street" },
    { name: "city" as const, label: "City", type: "text", icon: <Building size={14} />, placeholder: "Nairobi" },
    { name: "postalCode" as const, label: "Postal Code", type: "text", icon: <Hash size={14} />, placeholder: "00100" },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-black/60">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
        <div className="w-7 h-7 rounded-full bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center">
          <MapPin size={13} className="text-electric-blue" />
        </div>
        <div>
          <h2 className="font-display text-sm font-bold text-white tracking-wide">Delivery Details</h2>
          <p className="font-mono-cyber text-[10px] text-white/30 tracking-wide mt-0.5">Where should we send your order?</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Delivery Method Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "doorstep")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${form.watch("deliveryMethod") === "doorstep"
                  ? "bg-white/10 border-white/40 text-white"
                  : "bg-white/3 border-white/10 text-white/40"
                }`}
            >
              <Truck size={18} />
              <span className="text-[10px] font-display font-bold tracking-widest uppercase">Doorstep</span>
            </button>
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "pickup")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${form.watch("deliveryMethod") === "pickup"
                  ? "bg-white/10 border-white/40 text-white"
                  : "bg-white/3 border-white/10 text-white/40"
                }`}
            >
              <Store size={18} />
              <span className="text-[10px] font-display font-bold tracking-widest uppercase">Pickup</span>
            </button>
          </div>

          {form.watch("deliveryMethod") === "pickup" ? (
            <FormField
              control={form.control}
              name="pickupPointId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Store size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 z-10" />
                      <select
                        {...field}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-body appearance-none focus:outline-none focus:border-white/30"
                      >
                        <option value="" disabled className="bg-black">Select Pickup Point</option>
                        {PICKUP_POINTS.map(point => (
                          <option key={point.id} value={point.id} className="bg-black">
                            {point.name} — {point.location} (KES {point.fee})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                        ↓
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500 mt-1 font-mono-cyber uppercase" />
                </FormItem>
              )}
            />
          ) : (
            <>
              {fields.map(({ name, label, type, icon, placeholder }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <FuturisticInput
                          {...field}
                          label={label}
                          type={type}
                          icon={icon}
                          placeholder={placeholder}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                      <FormMessage className="hidden" />
                    </FormItem>
                  )}
                />
              ))}
            </>
          )}

          {/* Country (read-only) */}
          <div className="relative">
            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 z-10" />
            <div className="flex items-center pl-10 pr-4 py-3.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/30 font-body">
              Kenya 🇰🇪
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              id="shipping-back-btn"
              className="flex-1 holo-btn rounded-xl py-3.5 text-xs font-display tracking-widest"
            >
              BACK
            </button>
            <button
              type="submit"
              id="shipping-continue-btn"
              className="flex-[2] holo-btn holo-btn-red flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-display font-bold tracking-widest"
            >
              CONTINUE TO PAYMENT
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
