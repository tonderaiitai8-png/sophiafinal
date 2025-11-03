# Sophia AI Restaurant Ordering System

An intelligent, conversational restaurant ordering system powered by OpenAI GPT-4 Turbo. Built for **Woody's Burger, Chicken & Ribs**, this AI assistant provides a natural, personalized ordering experience with advanced features like allergy filtering, dietary preferences, and real-time cart management.

## 🌟 Features

### 🤖 AI-Powered Ordering
- **Natural Conversation**: Chat naturally with Sophia AI to browse the menu and place orders
- **Intelligent Recommendations**: Get personalized suggestions based on preferences and dietary restrictions
- **Context-Aware**: AI remembers your conversation and dietary needs throughout the session

### 🍽️ Comprehensive Menu Management
- **200+ Menu Items**: Full restaurant menu with detailed descriptions, prices, and allergen information
- **Smart Search**: AI can filter menu items by category, price, dietary tags, and allergens
- **Real-Time Updates**: Menu data dynamically loaded from restaurant configuration

### 🛡️ Allergy & Dietary Support
- **Allergy Filtering**: Automatically excludes items containing specific allergens
- **Dietary Preferences**: Supports vegetarian, vegan, gluten-free, and other dietary needs
- **Safe Recommendations**: AI only suggests items that meet your dietary requirements

### 🛒 Shopping Cart Features
- **Real-Time Updates**: Cart updates instantly as you order through conversation
- **Item Management**: Add, remove, or modify quantities via natural language
- **Price Calculation**: Automatic total calculation with item-by-item breakdown
- **Visual Cart**: Clean, modern cart interface showing all items and totals

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful, modern interface with glassmorphic elements
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Professional animations and transitions throughout
- **Intuitive Navigation**: Easy access to menu, cart, and chat features

## 🚀 Live Demo

**Production Site**: [https://x7wn52iccny0.space.minimax.io](https://x7wn52iccny0.space.minimax.io)

Try asking Sophia AI:
- "Show me vegetarian options"
- "I'm allergic to nuts and dairy, what can I safely eat?"
- "What's your best-selling item?"
- "Add a Mega Platter to my cart"
- "Tell me about the Grilled Chicken Salad"

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite 6.0** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### AI Integration
- **OpenAI GPT-4 Turbo** - Advanced natural language processing
- **Function Calling** - Structured cart operations and menu search
- **Streaming Responses** - Fast, real-time AI interactions

### UI Components
- **Radix UI** - Accessible, headless UI primitives
- **Custom Components** - Purpose-built for restaurant ordering
- **Glass Morphism** - Modern glassmorphic design system

## 📦 Installation

### Prerequisites
- Node.js 18+ or pnpm
- OpenAI API Key

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd sophia-ai-production
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

Create a `.env` file in the project root:

```env
# Production Mode
VITE_MODE=production

# OpenAI API Key (Required)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

⚠️ **Important**: Never commit your `.env` file to version control. Add it to `.gitignore`.

4. **Start development server**
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

5. **Build for production**
```bash
pnpm build
```

Production files will be generated in the `dist/` directory.

## 🎯 Usage Guide

### Starting a Conversation

When you open the app, Sophia AI greets you with:
> "Hi! Welcome to Woody's. I'm your AI assistant. How can I help you order today? You can ask me about the menu or tell me if you have any allergies."

### Ordering Items

Simply chat naturally:
- "I'd like a cheeseburger"
- "Add two portions of chicken wings to my order"
- "Can I get the Mega Platter?"

### Dietary Restrictions

Tell Sophia about your dietary needs:
- "I'm allergic to peanuts and shellfish"
- "I'm vegetarian"
- "I need gluten-free options"
- "I can't have dairy"

Sophia will remember your restrictions and only recommend safe items.

### Menu Browsing

Ask about specific items or categories:
- "What burgers do you have?"
- "Tell me about your salads"
- "What's the price of the BBQ Ribs?"
- "Do you have any vegan options?"

### Managing Your Cart

Use natural language to manage your order:
- "Remove the fries from my order"
- "Change the burger quantity to 3"
- "Clear my cart"
- "What's in my cart?"

## 📁 Project Structure

```
sophia-ai-production/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Global styles and glassmorphism
│   ├── openaiService.ts        # OpenAI integration with GPT-4
│   ├── openaiService-backend.ts # Backend proxy service (alternative)
│   ├── menuData.ts             # Restaurant menu and configuration
│   ├── main.tsx               # Application entry point
│   └── index.css              # Base Tailwind styles
├── public/                     # Static assets
├── dist/                       # Production build output
├── .env                        # Environment variables (not committed)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── vite.config.ts             # Vite build configuration
```

## 🔑 Key Components

### `App.tsx`
Main application component managing:
- Chat interface and message history
- Session state (cart, dietary preferences, conversation history)
- UI controls (cart display, menu browser)
- Real-time cart updates

### `openaiService.ts`
OpenAI integration handling:
- GPT-4 Turbo API calls with function calling
- Cart operations (add, remove, clear)
- Menu search with filters
- Dietary restriction management
- Conversation history management

### `menuData.ts`
Restaurant configuration including:
- Complete menu with 200+ items
- Categories, descriptions, prices
- Allergen information
- Dietary tags (vegetarian, vegan, gluten-free)
- System prompts and welcome messages

## 🔐 Security Considerations

### Current Implementation
- API key stored in environment variables
- Client-side OpenAI integration for fast responses
- No backend required for basic functionality

### Production Recommendations

For enhanced security in production:

1. **Use Backend Proxy** (Recommended for public deployments)
   - Hide API keys server-side
   - Implement rate limiting
   - Add authentication/authorization
   - Monitor usage and costs

2. **Alternative: Supabase Edge Functions**
   - Serverless backend for API key protection
   - Built-in authentication
   - Automatic scaling
   - Cost-effective for small to medium traffic

See `openaiService-backend.ts` for backend proxy implementation example.

## 🚢 Deployment

### Quick Deploy (Current)
The app is currently deployed at: **https://x7wn52iccny0.space.minimax.io**

### Deploy to Your Own Server

1. **Build the production bundle**
```bash
pnpm build
```

2. **Deploy the `dist/` folder** to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Set environment variables** in your hosting platform:
```
VITE_MODE=production
VITE_OPENAI_API_KEY=your_key_here
```

### Deploy with Backend (Recommended for Production)

If using the backend proxy version:

1. Deploy backend API (Node.js/Python) to:
   - Railway
   - Render
   - Heroku
   - AWS Lambda
   - Supabase Edge Functions

2. Update `.env`:
```env
VITE_MODE=production
VITE_API_BASE=https://your-backend-url.com
```

3. Deploy frontend with updated configuration

## 🎨 Customization

### Changing Restaurant Configuration

Edit `src/menuData.ts`:

```typescript
export const RESTAURANT_CONFIG = {
  restaurantInfo: {
    name: "Your Restaurant Name",
    tagline: "Your Tagline",
    cuisine: "Your Cuisine Type"
  },
  menu: {
    categories: [
      {
        id: "category-1",
        name: "Category Name",
        items: [
          {
            id: "item-1",
            name: "Item Name",
            price: 9.99,
            description: "Description",
            allergens: ["Gluten", "Dairy"],
            tags: ["vegetarian"]
          }
        ]
      }
    ]
  }
};
```

### Modifying AI Behavior

Edit the system prompt in `src/menuData.ts`:

```typescript
prompts: {
  systemPrompt: "Your custom AI instructions here...",
  welcomeMessage: "Your custom welcome message..."
}
```

### Styling Changes

Modify `src/App.css` for:
- Color scheme (primary color: `#C41E3A`)
- Glassmorphism effects
- Animations and transitions
- Custom component styles

## 📊 Menu Statistics

- **Total Items**: 200+ dishes
- **Categories**: Burgers, Chicken, Ribs, Sides, Salads, Drinks, Desserts
- **Allergen Tracking**: 15+ common allergens
- **Dietary Options**: Vegetarian, Vegan, Gluten-Free, Dairy-Free
- **Price Range**: £1.50 - £45.99

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is created by MiniMax Agent.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 Turbo API
- **React Team** for the amazing framework
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible components
- **Lucide** for beautiful icons

## 📞 Support

For issues or questions:
1. Check the documentation above
2. Review error messages in browser console
3. Verify OpenAI API key is valid and has credits
4. Ensure environment variables are set correctly

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full AI-powered ordering system
- 200+ menu items
- Allergy and dietary filtering
- Real-time cart management
- Modern glassmorphic UI
- Mobile-responsive design

---

**Built with ❤️ by MiniMax Agent**
