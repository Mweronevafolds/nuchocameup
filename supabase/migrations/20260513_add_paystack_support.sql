-- Add Paystack fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_transaction_id TEXT;

-- Update payment_method default from MPESA to PAYSTACK
-- This doesn't change existing records, just the default for new ones
ALTER TABLE public.orders ALTER COLUMN payment_method SET DEFAULT 'PAYSTACK';

-- Create index on paystack_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_paystack_reference ON public.orders(paystack_reference);

-- Create index on payment status for order tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
