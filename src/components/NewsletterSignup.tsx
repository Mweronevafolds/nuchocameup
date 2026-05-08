import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Check } from "lucide-react";

const newsletterSchema = z.object({
    phone_number: z
        .string()
        .regex(
            /^(?:\+254|0|254)[17]\d{8}$/,
            "Please enter a valid Kenyan phone number (254712345678 or 0712345678)"
        ),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function NewsletterSignup() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsletterFormData>({
        resolver: zodResolver(newsletterSchema),
    });

    const onSubmit = async (data: NewsletterFormData) => {
        setIsSubmitting(true);
        try {
            // Normalize phone number to 254 format
            let phoneNumber = data.phone_number.replace(/^0/, "254").replace(/^\+/, "");
            if (!phoneNumber.startsWith("254")) {
                phoneNumber = "254" + phoneNumber;
            }

            const { error } = await supabase
                .from("newsletter_subscriptions")
                .insert({
                    phone_number: phoneNumber,
                });

            if (error) {
                if (error.code === "23505") {
                    // Unique constraint violated
                    toast({
                        title: "Already Subscribed",
                        description: "This phone number is already on our list!",
                        variant: "default",
                    });
                } else {
                    throw error;
                }
            } else {
                setIsSuccess(true);
                toast({
                    title: "Subscribed!",
                    description: "You'll get updates on new drops. Stay fly! 🚀",
                });
                reset();
                // Reset success state after 3 seconds
                setTimeout(() => setIsSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Newsletter signup error:", error);
            toast({
                title: "Subscription Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto px-4 py-6">
            <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Bell size={18} className="text-foreground/80" />
                    <h3 className="font-semibold text-sm tracking-wide uppercase">New Drops Alert</h3>
                </div>
                <p className="text-xs text-foreground/60">Get notified about fresh gear and exclusive drops</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="relative">
                    <Input
                        {...register("phone_number")}
                        type="tel"
                        placeholder="0712345678 or +254712345678"
                        className="text-sm h-10 bg-background/5 border-background/20"
                        disabled={isSubmitting || isSuccess}
                    />
                    {isSuccess && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <Check size={16} />
                        </div>
                    )}
                </div>

                {errors.phone_number && (
                    <p className="text-xs text-red-500">{errors.phone_number.message}</p>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full h-10 text-xs font-semibold uppercase tracking-wide bg-foreground text-background hover:bg-foreground/90"
                >
                    {isSuccess ? "✓ Subscribed" : isSubmitting ? "Subscribing..." : "Stay Updated"}
                </Button>
            </form>

            <p className="text-xs text-foreground/40 text-center mt-3">
                SMS notifications only. No spam. Unsubscribe anytime.
            </p>
        </div>
    );
}
