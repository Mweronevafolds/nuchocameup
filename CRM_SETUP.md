# CRM & Notification System Setup

## Overview

Your 2FLY Daily CRM now has:
1. **Newsletter/Drop Subscribers** (phone + email)
2. **Order Notifications** (email + SMS on checkout & payment)
3. **Drop Broadcasts** (email, SMS, WhatsApp)
4. **Real Supabase data only** (no mock fallbacks)
5. **14-day newest products filter**

---

## Required Integrations

### Resend (Email)
1. Sign up: https://resend.com
2. Add secret to Supabase:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
3. Verify domain in Resend dashboard

### Twilio (SMS + WhatsApp)
1. Sign up: https://twilio.com
2. Get credentials from Twilio Console:
   - Account SID
   - Auth Token
   - Phone Number (for SMS)
3. Add to Supabase Edge Function Secrets:
   - **TWILIO_ACCOUNT_SID**
   - **TWILIO_AUTH_TOKEN**
   - **TWILIO_PHONE** (your Twilio number)
4. For WhatsApp, enable WhatsApp Sandbox in Twilio

---

## Database Schema

### `newsletter_subscriptions` (Updated)
```sql
- id (UUID)
- email (TEXT) - Optional, but at least one contact required
- phone_number (TEXT) - Optional, but at least one contact required
- is_active (BOOLEAN)
- subscribed_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `orders` (Updated)
- Now tracks `order_status`: pending → processing → shipped → completed
- Paystack webhook auto-updates payment status

### `order_items`
- Linked to orders, stores product details at purchase time

---

## CRM Flows

### 1. Drop Broadcast (Admin Panel)
- Admin adds product
- Clicks broadcast channel (Email/SMS/WhatsApp)
- System fetches active subscribers from `newsletter_subscriptions`
- Sends to all active contacts with email/phone

### 2. Order Confirmation Flow
- Customer completes checkout
- `useCheckout.ts` creates order → triggers `order-notify` function
- Customer gets email + SMS confirmation
- If Paystack payment succeeds → webhook calls `order-notify` again with "processing" status

### 3. Newest Products (14-day window)
- `/shop?sort=newest` now filters products created in last 14 days
- Sorts by newest first
- Uses only Supabase data (no mock fallbacks)

---

## Edge Functions Deployed

1. **paystack-initialize** - Initiate payment
2. **paystack-webhook** - Handle payment success/failure + trigger order notifications
3. **broadcast-drop** - Send drops via email/SMS/WhatsApp
4. **order-notify** - Send order confirmations via email/SMS

---

## Setup Checklist

- [ ] Deploy 4 edge functions to Supabase
- [ ] Add Resend API key to Supabase secrets
- [ ] Add Twilio credentials to Supabase secrets
- [ ] Run database migration (adds email to newsletter_subscriptions)
- [ ] Test signup (footer form)
- [ ] Test drop broadcast (Admin panel)
- [ ] Test order notification (checkout page)

---

## Testing

### Test Signup
1. Go to homepage
2. Scroll to footer
3. Enter email or phone (Kenyan format)
4. Should see "Welcome to the crew!"

### Test Drop Broadcast
1. Login to Admin
2. Add a product
3. Click one of 3 broadcast buttons
4. Check logs for success/failure count

### Test Order Notification
1. Go to checkout
2. Fill shipping details
3. Should receive email + SMS immediately after order creation
4. After payment success, should receive another "processing" update

---

## Notes

- All data now comes from Supabase (products, subscribers, orders)
- No mock/local fallbacks—ensures real-time accuracy
- 14-day newest filter applied at database level
- Customers must have email OR phone (constraint enforced)
- Order status auto-updates on webhook
