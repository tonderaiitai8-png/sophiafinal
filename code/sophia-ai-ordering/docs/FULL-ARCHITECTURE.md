# AGORA v2.0 - COMPLETE FULL-STACK MVP ARCHITECTURE
## Restaurant AI Ordering Widget SaaS | Senior Architect Design

---

## EXECUTIVE SUMMARY

**Product:** Sophia AI Ordering Widget - White-label templated SaaS for restaurants  
**MVP Scope:** Single restaurant (Woody's) → Multi-tenant by v1.1  
**Tech Stack:** TypeScript/Svelte (frontend) + Node.js/Fastify (backend) + PostgreSQL (db)  
**Deployment:** Vercel (widget CDN) + Railway/Render (backend) + Supabase (database)  
**Time to MVP:** 4 weeks (development) + 1 week (hardening)

---

## ARCHITECTURE LAYERS

```
┌──────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER'S WEBSITE                               │
│        (Woody's site, Wix, Squarespace, WordPress, etc.)            │
│                                                                      │
│   <script src="https://cdn.agora.co/widget.js"                      │
│     data-restaurant="woody-andover"                                 │
│     data-env="production">                                          │
│   </script>                                                          │
│                                                                      │
│   <!-- Sophia pops up automatically as a chat bubble -->            │
│                                                                      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   CDN DELIVERY LAYER                                 │
│                   (Vercel/Cloudflare)                               │
│                                                                      │
│  • widget.js (~150kb gzipped, bundle + runtime)                    │
│  • Cached globally, served from edge                               │
│  • Auto-loads restaurant config on initialize                      │
│                                                                      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   WIDGET (SvelteKit + Svelte)                        │
│                                                                      │
│  Components:                                                         │
│  • ChatBubble.svelte (floating button, non-intrusive)              │
│  • ChatWindow.svelte (modal/drawer interface)                      │
│  • MessageList.svelte (scrollable conversation)                    │
│  • InputBar.svelte (send message + attachments)                    │
│  • MenuBrowser.svelte (browse & select items)                      │
│  • CartSummary.svelte (order preview, total)                       │
│                                                                      │
│  State Management:                                                   │
│  • Svelte stores (conversation, cart, session)                     │
│  • Session token in localStorage (stays across refreshes)          │
│  • WebSocket fallback to polling                                   │
│                                                                      │
│  UX Features:                                                        │
│  • Real-time typing indicators                                      │
│  • Message timestamps & read receipts                              │
│  • Cart persistence (localStorage)                                  │
│  • Mobile optimized (responsive design)                            │
│                                                                      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│   API GATEWAY                │        │   STATIC CONFIG FETCH        │
│   (Fastify on Railway)       │        │   (/config/:restaurantId)    │
│                              │        │                              │
│  Routes:                     │        │  Returns:                    │
│  • POST /api/chat            │        │  • Menu (items, prices)      │
│  • POST /api/session         │        │  • Branding (colors, logo)   │
│  • GET /api/config/:id       │        │  • Prompts (system prompts)  │
│  • POST /api/order           │        │  • Operating hours           │
│  • GET /health               │        │  • Integrations              │
│                              │        │                              │
└──────────────────────────────┘        └──────────────────────────────┘
        │
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Fastify/Node.js)                         │
│                                                                      │
│  Layers:                                                             │
│                                                                      │
│  1. ROUTING (src/routes)                                            │
│     • Express-style controllers                                     │
│     • Request validation with Zod                                   │
│     • Error handling middleware                                     │
│                                                                      │
│  2. BUSINESS LOGIC (src/services)                                   │
│     • IntentParser - Parse user messages                           │
│       - "I want a burger" → INTENT_ADD_ITEM {item: burger}         │
│       - "What's your menu?" → INTENT_BROWSE_MENU                   │
│       - "I have nut allergy" → INTENT_SET_ALLERGIES                │
│     • OpenAI Handler - Menu-locked chat                            │
│       - Function calling with item enum                            │
│       - Response validation                                         │
│       - Fallback logic                                              │
│     • OrderService - Cart & order management                       │
│       - Add/remove items                                            │
│       - Apply discounts                                             │
│       - Calculate totals                                            │
│     • SessionManager - Conversation state                          │
│       - Session tokens                                              │
│       - Allergies tracking                                          │
│       - Cart persistence                                            │
│                                                                      │
│  3. DATA ACCESS (src/db)                                            │
│     • Queries using sql tagged templates                           │
│     • Connection pooling (pg-pool)                                  │
│       - Restaurants table                                           │
│       - Orders table                                                │
│       - Sessions table                                              │
│       - Logs/analytics                                              │
│                                                                      │
│  4. EXTERNAL SERVICES (src/integrations)                            │
│     • OpenAI API wrapper                                            │
│     • Webhook handlers (payment, webhooks)                         │
│                                                                      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                              │
│                   (Supabase or Railway)                              │
│                                                                      │
│  Tables:                                                             │
│  • restaurants                                                       │
│    - id, name, location, phone, timezone                            │
│    - menu_id (foreign key to menu configs)                         │
│    - branding (colors, logo, custom prompts)                       │
│    - api_key (for authenticated calls)                             │
│                                                                      │
│  • menu_items                                                        │
│    - id, restaurant_id, name, description                          │
│    - price, category, allergens, in_stock                          │
│    - dietary_tags (vegan, vegetarian, gluten-free, etc.)          │
│                                                                      │
│  • sessions                                                          │
│    - id, restaurant_id, token, user_id                             │
│    - allergies (array of allergen ids)                             │
│    - metadata (device, location, created_at)                       │
│    - expires_at                                                      │
│                                                                      │
│  • orders                                                            │
│    - id, restaurant_id, session_id                                 │
│    - items (jsonb array of {item_id, qty, price})                 │
│    - total, status, created_at                                     │
│    - customer_contact (phone/email for delivery)                   │
│                                                                      │
│  • conversations                                                     │
│    - id, session_id, role, content                                 │
│    - timestamp, tokens_used (for analytics)                        │
│                                                                      │
│  • api_logs                                                          │
│    - timestamp, restaurant_id, endpoint, status_code               │
│    - latency, tokens_used, error_message                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## CORE FLOWS

### Flow 1: Widget Initialization
```
1. <script> tag loads widget.js from CDN
2. Widget injects HTML into page (shadow DOM for isolation)
3. Fetches GET /api/config/woody-andover
4. Loads menu, branding, prompts
5. Creates Svelte app with restaurant config
6. Displays chat bubble
7. On click → opens chat window
```

### Flow 2: Customer Places Order
```
1. Customer: "Can I get a burger?"
2. Widget sends → POST /api/chat
   {
     sessionToken: "abc123",
     message: "Can I get a burger?"
   }
3. Backend:
   a) Parse intent → INTENT_ADD_ITEM
   b) Validate item in menu
   c) Check allergies
   d) Add to cart
   e) Generate response
4. Backend returns:
   {
     reply: "Great! Which burger would you like?",
     cart: [{ itemId: "...", qty: 1, price: 5.95 }],
     suggestedItems: [...]
   }
5. Widget displays response, updates cart UI
```

### Flow 3: AI Fallback (Unknown Intent)
```
1. Customer: "Tell me something funny"
2. Backend doesn't recognize intent
3. Falls back to OpenAI (GPT-4 with function calling)
4. System prompt:
   "You are Sophia, AI for Woody's Burger.
    ONLY suggest items from menu: [item list]
    NEVER discuss non-food topics.
    If asked something off-topic, redirect."
5. OpenAI responds with menu-locked response
6. Response validation ensures no hallucinations
7. If hallucination detected, return safe fallback
```

---

## CRITICAL COMPONENTS

### 1. INTENT PARSER (Deterministic)
**Purpose:** Identify customer intent without AI (fast, cheap, deterministic)

**Intents:**
- BROWSE_MENU
- ADD_ITEM {itemId, qty}
- REMOVE_ITEM {itemId}
- VIEW_CART
- SET_ALLERGIES {allergenIds}
- PLACE_ORDER
- CHECKOUT
- UNKNOWN (fallback to AI)

**Parser Logic:**
```typescript
function parseIntent(message: string): Intent {
  const lower = message.toLowerCase();
  
  // Match patterns
  if (lower.includes("burger")) return { type: "ADD_ITEM", itemId: findBurger() };
  if (lower.includes("allergies")) return { type: "SET_ALLERGIES" };
  if (lower.includes("cart")) return { type: "VIEW_CART" };
  if (lower.includes("checkout")) return { type: "CHECKOUT" };
  
  // If no match, return UNKNOWN (will use AI)
  return { type: "UNKNOWN" };
}
```

### 2. OPENAI MENU-LOCKER (with Function Calling)
**Purpose:** AI chat that CANNOT hallucinate items

**Architecture:**
```typescript
// 1. Build item enum from database
const itemIds = await db.query("SELECT id FROM menu_items WHERE restaurant_id = $1", [restaurantId]);
const itemEnum = itemIds.map(i => i.id); // ["burger-plain", "burger-cheese", ...]

// 2. Define schema
const functions = [{
  name: "add_item_to_cart",
  description: "Add item from menu to cart",
  parameters: {
    type: "object",
    properties: {
      item_id: { type: "string", enum: itemEnum }, // LOCKED!
      qty: { type: "integer", minimum: 1 }
    },
    required: ["item_id", "qty"]
  }
}];

// 3. Call OpenAI with schema + function calling
const response = await openai.createChatCompletion({
  model: "gpt-4-turbo",
  messages: [...conversationHistory],
  functions: functions,
  function_call: "auto"
});

// 4. If no function called, it's plain text (menu-safe response)
// If function called with invalid item_id, OpenAI can't generate it (schema-locked)
```

### 3. SESSION MANAGEMENT
**Purpose:** Track conversation state, cart, allergies across requests

**Session Storage:**
```typescript
interface Session {
  token: string;               // random UUID
  restaurantId: string;
  conversation: Message[];     // {role, content, timestamp}
  cart: CartItem[];           // {itemId, qty, price}
  allergies: string[];        // allergen IDs
  state: "browsing" | "confirming" | "checkout";
  createdAt: Date;
  expiresAt: Date;           // 24h TTL
}
```

**Persistence:**
- Short-term: In-memory Map in Node process
- Long-term: PostgreSQL
- Client-side: localStorage (session token only, not sensitive data)

### 4. MENU CONFIG (Per Restaurant)
**Structure:**
```json
{
  "restaurantInfo": {
    "name": "Woody's Burger, Chicken & Ribs",
    "location": "37 London Street, Andover, SP10 2NU, UK",
    "phone": "01264 352222",
    "timezone": "Europe/London"
  },
  "branding": {
    "primaryColor": "#C41E3A",      // Woody's red
    "secondaryColor": "#6B7280",
    "accentColor": "#10B981",
    "logoUrl": "https://...",
    "widgetPosition": "bottom-right",
    "chatBubbleText": "Order with Sophia"
  },
  "categories": [
    {
      "id": "burgers",
      "name": "Burgers",
      "description": "Fresh flame-grilled burgers",
      "items": [
        {
          "id": "burger-daytona",
          "name": "Daytona Burger",
          "description": "Lettuce, tomato & mayonnaise",
          "price": 6.95,
          "allergens": ["gluten"],
          "dietary": ["vegetarian-capable"],
          "inStock": true
        },
        {
          "id": "burger-cheese",
          "name": "Cheese Burger",
          "description": "Melted cheddar",
          "price": 6.45,
          "allergens": ["gluten", "dairy"],
          "inStock": true
        }
      ]
    },
    {
      "id": "chicken",
      "name": "Chicken",
      "items": [...]
    },
    {
      "id": "sides",
      "name": "Sides",
      "items": [
        {"id": "fries", "name": "Fries", "price": 2.99, "allergens": []},
        {"id": "coleslaw", "name": "Coleslaw", "price": 1.99, "allergens": []}
      ]
    }
  ],
  "prompts": {
    "systemPrompt": "You are Sophia, friendly AI assistant for Woody's. ONLY suggest items from the menu above. Never discuss non-food topics.",
    "welcomeMessage": "Hi! 👋 I'm Sophia, your ordering assistant at Woody's. What can I help you with?",
    "allergyQuestion": "Do you have any allergies I should know about?",
    "blockedItemMessage": "I'm sorry, that item contains something you're allergic to. Can I suggest an alternative?"
  }
}
```

---

## FILE STRUCTURE

```
agora/
├── frontend/                          # SvelteKit app (widget)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte           # Main widget shell
│   │   │   ├── +layout.svelte         # Layout wrapper
│   │   ├── components/
│   │   │   ├── ChatBubble.svelte      # Floating chat button
│   │   │   ├── ChatWindow.svelte      # Main chat modal
│   │   │   ├── MessageList.svelte     # Scrollable messages
│   │   │   ├── InputBar.svelte        # Message input + send
│   │   │   ├── MenuBrowser.svelte     # Browse categories/items
│   │   │   ├── CartSummary.svelte     # Order preview
│   │   │   └── Avatar.svelte          # Sophia avatar
│   │   ├── stores/
│   │   │   ├── chat.ts                # Conversation store
│   │   │   ├── cart.ts                # Cart store
│   │   │   └── session.ts             # Session store
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── types.ts               # TypeScript types
│   │   │   └── utils.ts               # Utilities
│   │   ├── app.css                    # Global styles
│   ├── vite.config.ts                 # Build config
│   ├── tsconfig.json
│   ├── package.json
│
├── backend/                           # Fastify API server
│   ├── src/
│   │   ├── server.ts                  # Main entry point
│   │   ├── routes/
│   │   │   ├── chat.ts                # POST /api/chat
│   │   │   ├── config.ts              # GET /api/config/:id
│   │   │   ├── session.ts             # Session endpoints
│   │   │   └── health.ts              # GET /health
│   │   ├── services/
│   │   │   ├── intentParser.ts        # Intent detection logic
│   │   │   ├── openaiHandler.ts       # Menu-locked AI calls
│   │   │   ├── orderService.ts        # Order/cart logic
│   │   │   └── sessionManager.ts      # Session management
│   │   ├── db/
│   │   │   ├── connection.ts          # PostgreSQL pool
│   │   │   ├── queries.ts             # SQL queries
│   │   │   └── schema.sql             # DB schema
│   │   ├── middleware/
│   │   │   ├── auth.ts                # API key validation
│   │   │   ├── cors.ts                # CORS setup
│   │   │   └── errorHandler.ts        # Error handling
│   │   ├── types.ts                   # Shared TypeScript
│   │   └── config.ts                  # Environment variables
│   ├── tsconfig.json
│   ├── package.json
│
├── database/
│   ├── schema.sql                     # DB schema definition
│   ├── migrations/                    # Future: migration files
│   └── seeds/                         # Test data
│
├── docs/
│   ├── ARCHITECTURE.md                # This file
│   ├── API.md                         # API endpoint docs
│   ├── DEPLOYMENT.md                  # Deployment guide
│   └── INTEGRATION.md                 # How to embed widget
│
├── .env.example                       # Environment template
├── docker-compose.yml                 # Local dev setup
├── README.md
└── package.json                       # Monorepo root
```

---

## DEPLOYMENT STRATEGY

### Development
```bash
# Local: Run everything locally
docker-compose up  # Postgres + Redis

# Terminal 1: Backend
cd backend && npm run dev  # Fastify on :3000

# Terminal 2: Frontend
cd frontend && npm run dev  # Vite on :5173

# Test widget:
# Open http://localhost:5173/demo
```

### Staging
```
Frontend:  Vercel (staging branch)
Backend:   Railway (staging env)
Database:  Supabase (staging project)
```

### Production
```
Frontend:  Vercel CDN (https://cdn.agora.co/widget.js)
Backend:   Railway (https://api.agora.co)
Database:  Supabase (encrypted, backups)
DNS:       Cloudflare (DDoS protection)
```

---

## KEY FEATURES (MVP)

✅ Embeddable chat widget (single script tag)
✅ Menu-locked AI (no hallucinations)
✅ Real-time conversation
✅ Shopping cart
✅ Allergy tracking
✅ Order summary
✅ Mobile responsive
✅ Session persistence
✅ Analytics logging
✅ Multi-restaurant ready (db schema supports it)

---

## SECURITY

1. **API Keys:** Restaurant ID + API key for authentication
2. **Session Tokens:** Random UUIDs, server-side validation
3. **CORS:** Whitelist restaurant domains
4. **Rate Limiting:** 100 messages/min per session
5. **Input Validation:** Zod schemas on all endpoints
6. **SQL Injection:** Parameterized queries always
7. **XSS Prevention:** Widget runs in iframe (optional)
8. **HTTPS:** All endpoints TLS 1.3+

---

## TESTING STRATEGY

**Unit Tests:** Intent parser, menu locker, cart logic
**Integration Tests:** API routes, database queries
**E2E Tests:** Full widget flow (Playwright)
**Load Testing:** 1000 concurrent sessions
**Performance:** <200ms for /api/chat endpoint

---

## NEXT PHASES

**v1.1:** Multi-tenant fully isolated
**v1.2:** Payment processing (Stripe integration)
**v1.3:** Analytics dashboard (restaurant admin panel)
**v1.4:** Voice ordering (speech-to-text)
**v1.5:** ML model fine-tuning on order data
**v2.0:** Enterprise features (SSO, custom branding, white-label)
