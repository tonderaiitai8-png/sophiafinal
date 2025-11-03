# Sophia AI Restaurant Ordering System

A production-ready AI-powered restaurant ordering system for Woody's Burger, Chicken & Ribs, featuring OpenAI GPT-4 Turbo integration with intelligent conversational ordering.

## ⚠️ CRITICAL SECURITY NOTICE

**Current Status: DEVELOPMENT MODE (NOT PRODUCTION-READY)**

### Security Issues:
1. **❌ Exposed API Key**: OpenAI API key is currently exposed on the client-side
2. **❌ Development Server**: Running on Vite dev server (not production-grade)
3. **❌ Missing Backend**: Secure Edge Function created but not deployed

### Why This Matters:
- Anyone can inspect browser code and steal the OpenAI API key
- Your API key can be used by others, incurring costs on your account
- Development servers are not optimized for production traffic

## 🏗️ Architecture

### Current (Insecure) Architecture:
```
Browser → Direct OpenAI API Call (with exposed key)
```

### Production (Secure) Architecture:
```
Browser → Supabase Edge Function → OpenAI API
```

The Edge Function acts as a secure proxy:
- API key stored as environment variable in Supabase (server-side)
- Client never has access to the API key
- Additional security controls and rate limiting possible

## 🚀 Production Deployment Steps

### Prerequisites:
- Supabase account
- OpenAI API key

### Step 1: Deploy Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy chat-ai

# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_openai_key_here
```

### Step 2: Update Frontend Configuration

Edit `.env`:
```env
VITE_MODE=production
VITE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/chat-ai
# Remove or comment out VITE_OPENAI_API_KEY
```

### Step 3: Update Code to Use Secure Backend

Edit `src/App.tsx`:
```typescript
// Change this line:
import { processAIMessage, SessionState } from './openaiService';

// To this:
import { sendMessage as processAIMessage, SessionState } from './openaiService-backend';
```

### Step 4: Build for Production

```bash
pnpm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 5: Deploy to Production Hosting

Deploy the `dist/` folder to your hosting provider:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 🛠️ Development

### Installation:
```bash
pnpm install
```

### Development Mode (Insecure - Local Testing Only):
```bash
pnpm run dev
```

### Build:
```bash
pnpm run build
```

### Preview Production Build:
```bash
pnpm run preview
```

## 📁 Project Structure

```
sophia-ai-production/
├── src/
│   ├── App.tsx                    # Main React component
│   ├── openaiService.ts           # ❌ Insecure: Direct OpenAI calls
│   ├── openaiService-backend.ts   # ✅ Secure: Edge Function calls
│   ├── menuData.ts                # Menu data structures
│   └── restaurant-config.json     # Full menu configuration
├── supabase/
│   └── functions/
│       └── chat-ai/
│           └── index.ts           # Secure backend proxy (34KB)
├── .env.example                   # Environment variable template
└── README.md                      # This file
```

## ✨ Features

- **AI-Powered Ordering**: GPT-4 Turbo with function calling
- **200+ Menu Items**: Complete Woody's menu catalog
- **Allergen Filtering**: Automatic filtering based on customer restrictions
- **Smart Cart Management**: Add, remove, view cart with AI assistance
- **Dietary Preferences**: Vegetarian, vegan, gluten-free options
- **Conversational UI**: Natural language ordering experience

## 🔧 Tech Stack

- **Frontend**: React 18.3 + TypeScript + Vite 6.0
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 Turbo with Function Calling
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Icons**: Lucide React

## 📊 Menu Categories

- Peri Peri Grilled Chicken
- Original Classic Fried Chicken
- Burgers
- Wraps
- Sides & Appetizers
- Vegetarian Options
- Family Platters
- Desserts & Ice Cream
- Milkshakes
- Drinks

## 🔐 Security Checklist

Before going to production, ensure:
- [ ] Supabase Edge Function deployed
- [ ] OpenAI API key set as Supabase secret
- [ ] Frontend updated to use `openaiService-backend.ts`
- [ ] `.env` configured with production values
- [ ] Production build created (`pnpm run build`)
- [ ] Deployed to production hosting (not dev server)
- [ ] Tested all functionality on production URL

## 📝 License

Proprietary - Woody's Burger, Chicken & Ribs

## 🤝 Support

For issues or questions, contact the development team.
