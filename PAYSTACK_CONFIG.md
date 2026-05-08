# Paystack Configuration Guide

## ⚠️ Current Status

**Just Fixed:** CORS headers in edge functions - deployed functions will now work properly.

---

## Step 1: Deploy Edge Functions via Supabase Dashboard

### Quick Deploy (Recommended - Copy & Paste)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **urmjaogeibqombfjscla**
3. Go to **Edge Functions** (left sidebar)

#### Deploy `paystack-initialize`:

4. Click **Create a New Function**
5. Name: `paystack-initialize`
6. Copy the entire content from: `supabase/functions/paystack-initialize/index.ts`
7. Paste it into the editor
8. Click **Deploy**

#### Deploy `paystack-webhook`:

9. Click **Create a New Function** again
10. Name: `paystack-webhook`
11. Copy the entire content from: `supabase/functions/paystack-webhook/index.ts`
12. Paste it into the editor
13. Click **Deploy**

---

## Step 2: Set Edge Function Secrets

After functions are deployed:

1. Go to **Settings** → **Edge Function Secrets** in Supabase Dashboard
2. Add these secrets exactly as shown:

| Key | Value |
|-----|-------|
| `PAYSTACK_SECRET_KEY` | `sk_live_REDACTED` |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_REDACTED` |
| `SUPABASE_URL` | `https://urmjaogeibqombfjscla.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | [Get from below] |

**To get SUPABASE_SERVICE_ROLE_KEY:**
- Go to **Settings** → **API**
- Look for **service_role (SECRET)**
- Copy the full value

---

## Step 3: Verify Functions are Deployed

Test that functions are working:

```bash
# Test from terminal
curl https://urmjaogeibqombfjscla.supabase.co/functions/v1/paystack-initialize \
  -X OPTIONS \
  -H "Origin: http://localhost:8080"
```

Should return: `200 OK`

---

## Step 4: Configure Paystack Webhook

In [Paystack Dashboard](https://dashboard.paystack.com):

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. **URL:** 
   ```
   https://urmjaogeibqombfjscla.supabase.co/functions/v1/paystack-webhook
   ```
4. **Active?** Toggle ON
5. **Events:** Select both:
   - ✅ `charge.success`
   - ✅ `charge.failed`
6. **Save**

Test the webhook from Paystack dashboard to verify it works.

---

## Step 5: Environment Variables

Verify `.env.local` has:

```
VITE_SUPABASE_URL=https://urmjaogeibqombfjscla.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_L_pQTkhdxkhUJgq9E3cUVw_9JpTKOYY
VITE_PAYSTACK_PUBLIC_KEY=pk_live_REDACTED
VITE_PAYSTACK_SECRET_KEY=sk_live_REDACTED
```

---

## Step 6: Test the Payment Flow

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to checkout page

3. Fill in shipping details

4. Enter email address

5. Click "PAY WITH PAYSTACK"

6. You should be redirected to Paystack payment page

**Test Card Details:**
- Card Number: `4111111111111111`
- Expiry: `05/30` (or any future date)
- CVV: `123`

7. Complete the test payment

8. You'll be redirected back to your app with order confirmation

---

## 🚨 Troubleshooting

### CORS Error in Browser

**Error:** `Access to fetch at 'https://urmjaogeibqombfjscla.supabase.co/functions/v1/paystack-initialize' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Solution:**
- ✅ Redeploy both edge functions (CORS headers were just fixed)
- Verify function shows in Supabase Dashboard → Edge Functions
- Check browser console for error details
- Refresh page after deployment

### Edge Function Not Found

**Error:** `404 - Function Not Found`

**Solution:**
- Go to Supabase Dashboard
- Confirm functions are listed under Edge Functions
- Redeploy if needed

### "Paystack not configured" Error

**Error:** `Paystack credentials not configured in Supabase secrets`

**Solution:**
- Go to **Settings** → **Edge Function Secrets**
- Add all 4 secrets (see Step 2)
- Redeploy functions after adding secrets

### Webhook Not Updating Order

**Check:**
1. Verify webhook URL is correct in Paystack Dashboard
2. Check Supabase function logs:
   - Dashboard → Edge Functions → paystack-webhook → Logs tab
3. Confirm database migration ran:
   - `supabase migration list`

---

## Useful Links

| Resource | URL |
|----------|-----|
| Supabase Project | https://app.supabase.com/project/urmjaogeibqombfjscla |
| Paystack Dashboard | https://dashboard.paystack.com |
| Paystack Documentation | https://paystack.com/docs/api |
| Supabase Edge Functions | https://supabase.com/docs/guides/functions |

---

## Quick Checklist ✓

- [ ] Database migration ran successfully
- [ ] Both edge functions deployed
- [ ] Secrets added to Supabase
- [ ] CORS preflight test passed
- [ ] Webhook configured in Paystack
- [ ] Test payment succeeded
- [ ] Order shows in database with payment status



