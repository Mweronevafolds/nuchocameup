-- Add email support for newsletter subscriptions (email + phone)
ALTER TABLE public.newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.newsletter_subscriptions
  ALTER COLUMN phone_number DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email
  ON public.newsletter_subscriptions (email);

ALTER TABLE public.newsletter_subscriptions
  DROP CONSTRAINT IF EXISTS newsletter_subscriptions_contact_check;

ALTER TABLE public.newsletter_subscriptions
  ADD CONSTRAINT newsletter_subscriptions_contact_check
  CHECK (phone_number IS NOT NULL OR email IS NOT NULL);
