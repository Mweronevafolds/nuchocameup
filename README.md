# 2FlyDaily - Modern E-Commerce Platform 🎉

**A fully-featured streetwear e-commerce platform with product search, shopping cart, checkout flow, and Paystack payment integration.**

Built with React 19, TypeScript, Tailwind CSS, Supabase, and Paystack Payment API.

---

## 🚀 Quick Start

**First time?** Start here: [QUICKSTART.md](./QUICKSTART.md) (5 min setup)

**Issues?** Check: [DEBUGGING.md](./DEBUGGING.md)

**Need config help?** See: [ENV_SETUP.md](./ENV_SETUP.md)

---

## ✨ Features

### 🛍️ Shopping Experience
- ✅ Product catalog with beautiful grid layout
- ✅ Full-text search (by name & description)
- ✅ Advanced filtering (price, size, stock status)
- ✅ Multiple sorting options (price, newest)
- ✅ Responsive design (mobile-first)
- ✅ Product detail pages with size selection
- ✅ Shopping cart with quantity management
- ✅ Cart drawer with slide-out interface

### 💳 Checkout & Payments
- ✅ Multi-step checkout flow
- ✅ Shipping address collection
- ✅ Paystack payment integration (card & digital wallets)
- ✅ Phone number validation
- ✅ Real-time payment status
- ✅ Order confirmation & email notifications
- ✅ Order history & tracking

### 🖼️ Performance
- ✅ Image optimization (WebP + responsive srcset)
- ✅ Lazy loading with placeholders
- ✅ Code splitting ready
- ✅ Fast builds with Vite
- ✅ Production build: ~725 KB JS

### 🛡️ Admin & Security
- ✅ Admin authentication (Supabase Auth)
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Error boundaries
- ✅ Secure form validation (Zod)
- ✅ RLS policies on all tables

### 🗄️ Database
- ✅ Supabase PostgreSQL backend
- ✅ Full schema with migrations
- ✅ Normalized tables: users, products, orders, order_items, cart_sessions
- ✅ Indexes for performance
- ✅ RLS security policies

---

## 📂 Project Structure

```
src/
├── pages/                    # Route pages
│   ├── Index.tsx            # Product listing with search
│   ├── ProductDetail.tsx    # Product detail page
│   ├── CheckoutPage.tsx     # Multi-step checkout
│   ├── OrderConfirmationPage.tsx
│   ├── Admin.tsx            # Admin dashboard
│   └── AdminLogin.tsx       # Admin auth
├── components/
│   ├── SearchBar.tsx        # Header search
│   ├── ProductFilter.tsx    # Filter sidebar
│   ├── ProductCard.tsx      # Product display
│   ├── OptimizedImage.tsx   # Responsive images
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── ProtectedRoute.tsx   # Route guard
│   └── checkout/            # Checkout components
├── hooks/
│   ├── useSearch.ts         # Full-text search
│   ├── useDebounce.ts       # Debounce hook
│   ├── useCheckout.ts       # Order creation
│   └── useAuth.ts           # Authentication
├── integrations/
│   ├── mpesa/client.ts      # Daraja API client
│   └── supabase/client.ts   # Supabase setup
├── validations/schemas.ts   # Zod schemas
└── test/                    # Unit tests
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **UI Components** | Shadcn/UI, Radix UI, Lucide Icons |
| **Forms** | React Hook Form, Zod validation |
| **State** | React Context, React Query |
| **Routing** | React Router v6 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Payments** | Safaricom Daraja M-Pesa API |
| **Build** | Vite, TypeScript |
| **Testing** | Vitest, Testing Library |

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ or Bun
- Supabase account (free tier works)
- Paystack account for payment processing

### Installation

1. **Clone and install:**
```bash
cd replica-shine-site-main
npm install  # or bun install
```

2. **Set up environment:**
```bash
cp .env.local.example .env.local
# Edit with your Supabase credentials
nano .env.local
```

3. **Apply database migrations:**
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase migration up
```

4. **Start dev server:**
```bash
npm run dev
# Opens http://localhost:5173
```

**Detailed setup:** See [QUICKSTART.md](./QUICKSTART.md) & [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Database migrations & configuration |
| [ENV_SETUP.md](./ENV_SETUP.md) | Environment variables explained |
| [DEBUGGING.md](./DEBUGGING.md) | Troubleshooting & error fixes |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Test coverage (if configured)
npm test -- --coverage
```

**Test files:**
- `src/test/cart.test.ts` - Cart context (10 tests)
- `src/test/debounce.test.ts` - Debounce hook (6 tests)

---

## 📦 Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
```

---

## 🌐 Deployment

### Production Build
```bash
npm run build
# Output: dist/ folder (725 KB JS + assets)
```

### Deploy to Vercel
```bash
vercel
# Add environment variables in dashboard
# Redeploy to apply changes
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

**Production checklist:**
- [ ] Update `VITE_APP_URL` to production domain
- [ ] Set `VITE_MPESA_ENV=production` (if using live payments)
- [ ] Use production M-Pesa credentials
- [ ] Enable CORS on Supabase
- [ ] Set up SSL certificate

---

## 🚀 Key Implementation Details

### Search & Filtering
- Full-text search using PostgreSQL's built-in FTS
- Debounced search input (300ms delay)
- Client-side filtering fallback when Supabase unavailable
- URL param persistence for shareable filters

### Image Optimization
- WebP format with JPEG fallback
- Responsive `srcset` generation (400px → 1200px)
- Lazy loading with skeleton placeholders
- Supabase Storage integration ready

### Checkout Flow
1. **Shipping Form** - Address collection + validation
2. **Payment Form** - Phone number input (Kenyan format)
3. **M-Pesa Integration** - STK push to customer phone
4. **Order Confirmation** - Real-time status polling

### M-Pesa Integration
- OAuth token management with automatic refresh
- Base64 password generation
- STK push for payment prompts
- Phone number validation (254XXXXXXXXX format)
- Webhook signature verification ready

### Admin Authentication
- Supabase Auth integration
- Role-based access control (is_admin flag)
- Protected route guard component
- Secure form validation

---

## 🐛 Troubleshooting

### 404 Error on Checkout?
**Cause:** Database migrations not applied
**Fix:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Products Not Loading?
**Cause:** Wrong Supabase credentials or table doesn't exist
**Fix:** Check [ENV_SETUP.md](./ENV_SETUP.md) & [DEBUGGING.md](./DEBUGGING.md)

### M-Pesa Not Working?
**Note:** M-Pesa is optional. App works without it.
**To enable:** Add credentials to `.env.local`

### Build Issues?
```bash
npm install --legacy-peer-deps
# or clear cache
rm -rf node_modules .next
npm install
```

---

## 📊 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build Time | < 60s | ~47s ✅ |
| Bundle Size | < 800 KB | 725 KB ✅ |
| Lighthouse Score | > 85 | TBD (before deploy) |
| First Contentful Paint | < 2s | TBD |

---

## 🔒 Security

### Authentication
- ✅ Supabase Auth (secure session management)
- ✅ JWT tokens (auto-refresh)
- ✅ Password hashing (bcrypt via Supabase)

### Database
- ✅ RLS policies (row-level security)
- ✅ Parameterized queries (no SQL injection)
- ✅ Admin role verification
- ✅ Order privacy (users see own orders only)

### API
- ✅ CORS configured
- ✅ Rate limiting (Supabase plan)
- ✅ Secure Paystack credentials (environment variables only)

### Form Validation
- ✅ Client-side (Zod schemas)
- ✅ Server-side (Supabase RLS)
- ✅ Phone number validation
- ✅ Email verification

---

## 🤝 Contributing

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configured
- Component-based architecture
- Custom hooks for reusable logic

### Adding Features
1. Create feature branch: `git checkout -b feature/my-feature`
2. Test thoroughly: `npm test`
3. Build: `npm run build`
4. Submit PR

---

## 📝 License

Private project. All rights reserved.

---

## 📞 Support

**Getting started?** → [QUICKSTART.md](./QUICKSTART.md)

**Stuck?** → [DEBUGGING.md](./DEBUGGING.md)

**Need config help?** → [ENV_SETUP.md](./ENV_SETUP.md)

**Database questions?** → [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

**Built with ❤️ for 2FlyDaily | April 2026**
