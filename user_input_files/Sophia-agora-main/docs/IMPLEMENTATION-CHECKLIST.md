# AGORA MVP - COMPLETE IMPLEMENTATION CHECKLIST

**Status:** Ready for Development  
**Start Date:** November 2, 2025  
**Target Launch:** December 2025  
**Product:** Sophia AI Ordering Widget for Woody's Burger, Chicken & Ribs

---

## PHASE 1: SETUP & SCAFFOLDING (Week 1)

### 1.1 Repository Structure
- [ ] Initialize monorepo root with package.json
- [ ] Create `/frontend` (SvelteKit)
- [ ] Create `/backend` (Fastify)
- [ ] Create `/database` (PostgreSQL schema)
- [ ] Add `.gitignore`, `.env.example`
- [ ] Initialize Git repo

### 1.2 Frontend Setup
```bash
npm create vite@latest frontend -- --template svelte
cd frontend
npm install
npm install -D typescript svelte-check
```

- [ ] Create src/components/ directory structure
- [ ] Create src/stores/ (Svelte stores)
- [ ] Create src/lib/ with API client
- [ ] Configure Vite for widget bundling
- [ ] Set up global CSS (Tailwind or custom)

### 1.3 Backend Setup
```bash
mkdir backend
cd backend
npm init -y
npm install fastify @fastify/cors dotenv openai zod
npm install -D typescript ts-node @types/node
```

- [ ] Create src/ directory structure
- [ ] Create basic server.ts with Fastify setup
- [ ] Configure environment variables (.env)
- [ ] Set up error handling middleware

### 1.4 Database Setup
```bash
# Option A: Supabase (cloud)
# Create project at supabase.com
# Option B: Local PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

- [ ] Save connection string to .env
- [ ] Create schema.sql with table definitions
- [ ] Run migrations
- [ ] Seed with test data (Woody's menu)

---

## PHASE 2: FRONTEND BUILD (Week 2)

### 2.1 Core Components
- [ ] **ChatBubble.svelte** - Floating button, opens on click
- [ ] **ChatWindow.svelte** - Main modal/drawer
- [ ] **MessageList.svelte** - Scrollable conversation
- [ ] **InputBar.svelte** - Message input + send button
- [ ] **CartSummary.svelte** - Order preview
- [ ] **MenuBrowser.svelte** - Category/item browser
- [ ] **Avatar.svelte** - Sophia animated avatar

### 2.2 State Management (Svelte Stores)
```typescript
// src/stores/chat.ts
export const messages = writable<Message[]>([]);
export const isLoading = writable(false);

// src/stores/cart.ts
export const cartItems = writable<CartItem[]>([]);
export const cartTotal = derived(cartItems, ...);

// src/stores/session.ts
export const sessionToken = writable<string>("");
export const allergies = writable<string[]>([]);
```

- [ ] Implement chat store (messages, loading state)
- [ ] Implement cart store (items, total calculation)
- [ ] Implement session store (token, allergies)
- [ ] Add localStorage persistence for session token
- [ ] Add localStorage persistence for draft cart

### 2.3 API Integration
```typescript
// src/lib/api.ts
export async function sendMessage(message: string) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionToken: get(sessionToken),
      message
    })
  });
  return response.json();
}
```

- [ ] Create API client in src/lib/api.ts
- [ ] Implement POST /api/chat wrapper
- [ ] Implement GET /api/config wrapper
- [ ] Add error handling & retry logic
- [ ] Add request/response typing

### 2.4 UI/UX Polish
- [ ] Mobile responsive design
- [ ] Dark/light mode toggle (optional for MVP)
- [ ] Typing indicators
- [ ] Message timestamps
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error messages

### 2.5 Widget Build Output
- [ ] Configure Vite to bundle widget.js (~150KB gzipped)
- [ ] Test widget embedding on plain HTML page
- [ ] Verify shadow DOM isolation (optional)
- [ ] Test on different browsers

---

## PHASE 3: BACKEND BUILD (Week 2-3)

### 3.1 Route Handlers
- [ ] **POST /api/chat** - Main chat endpoint
  - Input: { sessionToken, message }
  - Output: { reply, cart, conversation, state }
- [ ] **GET /api/config/:restaurantId** - Get restaurant config & menu
  - Cached for 1 hour
- [ ] **POST /api/session** - Create new session
- [ ] **GET /health** - Health check for monitoring

### 3.2 Services Implementation

#### 3.2.1 Intent Parser (src/services/intentParser.ts)
```typescript
export function parseIntent(message: string): Intent {
  if (includes(message, "burger")) return { type: "ADD_ITEM", itemId: "burger-*" };
  if (includes(message, "allergies")) return { type: "SET_ALLERGIES" };
  if (includes(message, "checkout")) return { type: "CHECKOUT" };
  return { type: "UNKNOWN" }; // Falls back to AI
}
```

- [ ] Implement pattern matching for common intents
- [ ] Add allergen detection patterns
- [ ] Add checkout/ordering patterns
- [ ] Return detailed intent objects

#### 3.2.2 OpenAI Handler (src/services/openaiHandler.ts)
- [ ] ✅ Already provided above!
- [ ] Integrate with production OpenAI API key
- [ ] Test function calling with menu enum
- [ ] Implement response validation
- [ ] Add fallback responses

#### 3.2.3 Session Manager (src/services/sessionManager.ts)
```typescript
export function createSession(restaurantId: string): Session {
  return {
    token: randomUUID(),
    restaurantId,
    conversation: [],
    cart: [],
    allergies: [],
    state: "DEFAULT",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h TTL
  };
}
```

- [ ] Implement session creation
- [ ] Implement session retrieval
- [ ] Add expiration checking
- [ ] Persist to database

#### 3.2.4 Order Service (src/services/orderService.ts)
- [ ] Add item to cart (qty validation)
- [ ] Remove item from cart
- [ ] Update item quantity
- [ ] Calculate cart total (with tax)
- [ ] Apply allergen filtering
- [ ] Generate order summary

### 3.3 Database Layer
- [ ] Create PostgreSQL connection pool
- [ ] Implement query builders or use sql tagged templates
- [ ] Create CRUD operations for:
  - [ ] Restaurants
  - [ ] Menu items
  - [ ] Sessions
  - [ ] Orders
  - [ ] Conversations

### 3.4 Error Handling
- [ ] Global error handler middleware
- [ ] Zod validation on all inputs
- [ ] Meaningful error messages
- [ ] Error logging
- [ ] Rate limiting (optional for MVP)

---

## PHASE 4: INTEGRATION & TESTING (Week 3-4)

### 4.1 End-to-End Testing
- [ ] Local widget embedding test
- [ ] Send test message: "Can I get a burger?"
- [ ] Verify intent parsing
- [ ] Verify cart update
- [ ] Verify response from AI

### 4.2 Feature Testing
- [ ] [ ] Browse menu flow
- [ ] [ ] Add item to cart
- [ ] [ ] Set allergies (verify filtering)
- [ ] [ ] Checkout flow
- [ ] [ ] Session persistence (refresh page)
- [ ] [ ] Mobile responsiveness

### 4.3 AI Testing
- [ ] Test with: "Tell me about pizza" → redirects to menu
- [ ] Test with: "What's the weather?" → redirects to menu
- [ ] Test with: "I'm allergic to dairy" → filters items correctly
- [ ] Test with: "Get me a burger" → adds to cart
- [ ] Verify NO hallucinations in 100 test messages

### 4.4 Performance Testing
- [ ] Chat response time: <500ms (target)
- [ ] Widget load time: <2s
- [ ] Bundle size: <200KB gzipped
- [ ] Concurrent sessions: 100+ 

### 4.5 Security Testing
- [ ] API rate limiting
- [ ] XSS prevention (CSP headers)
- [ ] SQL injection prevention
- [ ] Session token validation
- [ ] CORS whitelist

---

## PHASE 5: DEPLOYMENT (Week 4)

### 5.1 Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
vercel deploy --prod
```

- [ ] Push to GitHub
- [ ] Connect Vercel to repo
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Verify widget.js is accessible at CDN URL
- [ ] Test embedding on external site

### 5.2 Backend Deployment (Railway or Render)
```bash
# Using Railway
railway up
# Or Render
git push heroku main
```

- [ ] Push backend to GitHub
- [ ] Connect Railway/Render
- [ ] Set environment variables (OPENAI_API_KEY, DATABASE_URL, etc.)
- [ ] Deploy backend
- [ ] Verify /health endpoint
- [ ] Test POST /api/chat from widget

### 5.3 Database Migration (Supabase)
- [ ] Create production Supabase project
- [ ] Run schema migrations
- [ ] Seed production data (Woody's menu)
- [ ] Test database connections
- [ ] Enable backups

### 5.4 Domain Setup
- [ ] Point cdn.agora.co to Vercel
- [ ] Point api.agora.co to Railway/Render
- [ ] Set up SSL certificates
- [ ] Configure DNS

### 5.5 Monitoring Setup
- [ ] Set up error logging (Sentry)
- [ ] Set up analytics (PostHog)
- [ ] Monitor API latency
- [ ] Monitor widget load times
- [ ] Alert on errors

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Intent parser logic
- [ ] Cart calculations
- [ ] Allergen filtering
- [ ] Session creation

### Integration Tests
- [ ] POST /api/chat flow
- [ ] GET /api/config flow
- [ ] Database queries

### E2E Tests (Playwright)
- [ ] Load widget
- [ ] Send message
- [ ] View cart
- [ ] Complete order flow

### Manual QA
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Safari
- [ ] iPhone
- [ ] Android

---

## RESOURCES PROVIDED

✅ **FULL-ARCHITECTURE.md** - Complete system design  
✅ **woody-menu-config.json** - Woody's menu + branding  
✅ **openaiHandler.ts** - Menu-locked AI handler  
✅ **This checklist** - Step-by-step implementation guide

---

## NEXT STEPS

1. **This Week:**
   - Clone/create the GitHub repo
   - Set up frontend (SvelteKit)
   - Set up backend (Fastify)
   - Load Woody's menu config into database

2. **Next Week:**
   - Build all frontend components
   - Build all backend routes
   - Wire up API integration

3. **Week 3:**
   - Integration testing
   - AI testing (no hallucinations!)
   - Performance tuning

4. **Week 4:**
   - Deploy to production
   - Test live widget
   - Monitor for issues

---

## SUPPORT RESOURCES

- Svelte Docs: https://svelte.dev
- Fastify Docs: https://www.fastify.io
- OpenAI API: https://platform.openai.com/docs
- Supabase Docs: https://supabase.com/docs
- PostgreSQL: https://www.postgresql.org/docs

---

## CONTACT

**Product:** Sophia AI Ordering Widget  
**Client:** Woody's Burger, Chicken & Ribs, Andover  
**SaaS:** Agora Platform  
**Status:** MVP Development  

Built by: Senior Architect Team  
Date: November 2, 2025
