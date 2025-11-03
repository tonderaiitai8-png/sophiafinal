import { useState, useEffect, useRef } from 'react';
import { Send, ShoppingCart, X, Menu as MenuIcon } from 'lucide-react';
import { RESTAURANT_CONFIG, MENU_LOOKUP } from './menuData';
import { processAIMessage as sendMessage, SessionState } from './openaiService';
import './App.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const [session, setSession] = useState<SessionState>({
    cart: {},
    conversationHistory: [],
    allergyRestrictions: [],
    dietaryPreferences: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: RESTAURANT_CONFIG.prompts.welcomeMessage,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await sendMessage(inputValue, session);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setSession(result.session);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cartItems = Object.entries(session.cart).map(([itemId, quantity]) => {
    const item = MENU_LOOKUP[itemId];
    return item ? {
      id: itemId,
      name: item.name,
      price: item.price,
      quantity,
      total: item.price * quantity
    } : null;
  }).filter(Boolean);

  const cartTotal = cartItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const cartCount = Object.values(session.cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#C41E3A]">
              {RESTAURANT_CONFIG.restaurantInfo.name}
            </h1>
            <p className="text-sm text-gray-600">AI-Powered Ordering</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="glass-button p-3"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCart(!showCart)}
              className="glass-button p-3 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C41E3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <div className="glass-card flex flex-col h-[calc(100vh-200px)]">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/20">
              <h2 className="text-lg font-semibold">Chat with Sophia AI</h2>
              <p className="text-sm text-gray-600">Your personal ordering assistant</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-[#C41E3A] text-white'
                        : 'glass-card'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-card p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about our menu, place an order..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#C41E3A] text-white rounded-xl hover:bg-[#a01830] transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cart/Menu Section */}
        <div className="lg:col-span-1">
          {showCart ? (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button onClick={() => setShowCart(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item: any) => (
                      <div key={item.id} className="glass-card p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <span className="font-semibold">£{item.total.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.quantity}x @ £{item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-[#C41E3A]">
                        £{cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <button className="w-full py-3 bg-[#C41E3A] text-white rounded-xl hover:bg-[#a01830] transition-all font-semibold">
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : showMenu ? (
            <div className="glass-card p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setShowMenu(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {RESTAURANT_CONFIG.menu.categories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h3 className="font-semibold mb-3 text-[#C41E3A]">{category.name}</h3>
                  <div className="space-y-2">
                    {category.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="glass-card p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-sm ml-2">£{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[#C41E3A] opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Ready to Order?</h2>
              <p className="text-gray-600 mb-4">
                Chat with our AI assistant to place your order or browse the menu.
              </p>
              <button
                onClick={() => setShowMenu(true)}
                className="px-6 py-3 bg-[#C41E3A] text-white rounded-xl hover:bg-[#a01830] transition-all font-semibold"
              >
                View Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
