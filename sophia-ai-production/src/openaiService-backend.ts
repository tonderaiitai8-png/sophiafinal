// Sophia AI Service - Backend Integration (Secure)
// This version calls our existing backend API instead of OpenAI directly

export interface SessionState {
  cart: Record<string, number>;
  conversationHistory: any[];
  allergyRestrictions: string[];
  dietaryPreferences: string[];
}

// Point to our existing backend API
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3002';

export async function sendMessage(
  message: string,
  sessionState: SessionState
): Promise<{ reply: string; updatedState: SessionState; functionResults?: any[] }> {
  
  if (!API_BASE) {
    throw new Error('API_BASE not configured. Please set VITE_API_BASE in .env');
  }

  try {
    const sessionId = 'web-session-' + Date.now();
    
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Our backend returns: { reply, cart, sessionId }
    return {
      reply: data.reply,
      updatedState: {
        cart: data.cart?.items?.reduce((acc: any, item: any) => {
          acc[item.id] = item.quantity;
          return acc;
        }, {}) || sessionState.cart,
        conversationHistory: sessionState.conversationHistory,
        allergyRestrictions: sessionState.allergyRestrictions,
        dietaryPreferences: sessionState.dietaryPreferences,
      },
      functionResults: [],
    };
  } catch (error) {
    console.error('Error calling API:', error);
    throw new Error(`Failed to communicate with backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper to format cart for display
export function formatCart(cart: Record<string, number>): string {
  if (Object.keys(cart).length === 0) {
    return 'Your cart is empty.';
  }

  const items = Object.entries(cart).map(([itemId, quantity]) => {
    return `${itemId}: ${quantity}x`;
  });

  return 'Cart:\n' + items.join('\n');
}

// Helper to get total items in cart
export function getCartItemCount(cart: Record<string, number>): number {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}
