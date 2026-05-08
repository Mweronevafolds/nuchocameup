-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to recover/create missing user profile
-- Called when user profile is not found (406 error)
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID, user_email TEXT)
RETURNS TABLE (id UUID, email TEXT, is_admin BOOLEAN, full_name TEXT) AS $$
BEGIN
  -- Try to get existing profile
  RETURN QUERY SELECT u.id, u.email, u.is_admin, u.full_name
  FROM public.users u
  WHERE u.id = user_id;
  
  -- If no profile found, create one
  IF NOT FOUND THEN
    INSERT INTO public.users (id, email, is_admin)
    VALUES (user_id, user_email, false)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN QUERY SELECT u.id, u.email, u.is_admin, u.full_name
    FROM public.users u
    WHERE u.id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone_number TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  shipping_address JSONB NOT NULL, -- {street, city, postal_code, country}
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL DEFAULT 'MPESA',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  mpesa_receipt_number TEXT,
  mpesa_transaction_id TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_sessions table for persistent cart recovery
CREATE TABLE IF NOT EXISTS public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]', -- [{product_id, size, quantity}]
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter_subscriptions table for drop notifications
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
USING (auth.role() = 'service_role');

-- Orders RLS policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "Admin can view all orders"
ON public.orders FOR SELECT
USING (public.is_admin());

-- Order_items RLS policies (inherit from orders)
DROP POLICY IF EXISTS "Users can view items from their orders" ON public.order_items;
CREATE POLICY "Users can view items from their orders"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Cart sessions RLS policies
DROP POLICY IF EXISTS "Users can view their own cart sessions" ON public.cart_sessions;
CREATE POLICY "Users can view their own cart sessions"
ON public.cart_sessions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create cart sessions" ON public.cart_sessions;
CREATE POLICY "Anyone can create cart sessions"
ON public.cart_sessions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own cart sessions" ON public.cart_sessions;
CREATE POLICY "Users can update their own cart sessions"
ON public.cart_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Newsletter subscriptions RLS policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscriptions;
CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscriptions FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON public.cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_token ON public.cart_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_phone ON public.newsletter_subscriptions(phone_number);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_sessions_updated_at ON public.cart_sessions;
CREATE TRIGGER update_cart_sessions_updated_at
BEFORE UPDATE ON public.cart_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_updated_at ON public.newsletter_subscriptions;
CREATE TRIGGER update_newsletter_updated_at
BEFORE UPDATE ON public.newsletter_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
