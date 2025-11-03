// OpenAI Service for Sophia AI
import { RESTAURANT_CONFIG, MENU_LOOKUP, ALL_ALLERGENS, getMenuForAI } from './menuData';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface SessionState {
  cart: Record<string, number>;
  conversationHistory: any[];
  allergyRestrictions: string[];
  dietaryPreferences: string[];
}

const functions = [
  {
    name: 'add_to_cart',
    description: "Add an item to the customer's cart. Use this when the customer wants to order something.",
    parameters: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'The ID of the menu item to add' },
        quantity: { type: 'number', description: 'The quantity to add (default 1)' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'remove_from_cart',
    description: "Remove an item from the customer's cart or reduce its quantity.",
    parameters: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'The ID of the menu item to remove' },
        quantity: { type: 'number', description: 'The quantity to remove (default: all)' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'clear_cart',
    description: 'Clear the entire cart.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'search_menu',
    description: 'Search the menu for items matching criteria.',
    parameters: {
      type: 'object',
      properties: {
        exclude_allergens: { type: 'array', items: { type: 'string' } },
        dietary_tags: { type: 'array', items: { type: 'string' } },
        max_price: { type: 'number' }
      }
    }
  },
  {
    name: 'set_dietary_restrictions',
    description: "Record customer's allergy or dietary restrictions.",
    parameters: {
      type: 'object',
      properties: {
        allergens: { type: 'array', items: { type: 'string' } },
        dietary_prefs: { type: 'array', items: { type: 'string' } }
      }
    }
  }
];

function executeFunctionCall(functionName: string, args: any, session: SessionState) {
  const updatedSession = { ...session, cart: { ...session.cart } };

  switch (functionName) {
    case 'add_to_cart': {
      const { item_id, quantity = 1 } = args;
      const item = MENU_LOOKUP[item_id];
      
      if (!item) {
        return { result: { error: 'Item not found' }, session };
      }

      updatedSession.cart[item_id] = (updatedSession.cart[item_id] || 0) + quantity;
      
      return {
        result: {
          success: true,
          item: item.name,
          quantity,
          new_total: updatedSession.cart[item_id],
          price: item.price
        },
        session: updatedSession
      };
    }

    case 'remove_from_cart': {
      const { item_id, quantity = -1 } = args;
      const item = MENU_LOOKUP[item_id];
      
      if (!item || !updatedSession.cart[item_id]) {
        return { result: { error: 'Item not in cart' }, session };
      }

      if (quantity === -1 || updatedSession.cart[item_id] <= quantity) {
        delete updatedSession.cart[item_id];
      } else {
        updatedSession.cart[item_id] -= quantity;
      }

      return {
        result: { success: true, item: item.name, removed: true },
        session: updatedSession
      };
    }

    case 'clear_cart': {
      updatedSession.cart = {};
      return {
        result: { success: true, message: 'Cart cleared' },
        session: updatedSession
      };
    }

    case 'search_menu': {
      const { exclude_allergens = [], dietary_tags = [], max_price } = args;
      const results: any[] = [];
      
      RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (exclude_allergens.length > 0) {
            const hasAllergen = item.allergens?.some((a: string) => 
              exclude_allergens.some((ea: string) => a.toLowerCase().includes(ea.toLowerCase()))
            );
            if (hasAllergen) return;
          }

          if (dietary_tags.length > 0) {
            const hasTags = dietary_tags.every((tag: string) =>
              item.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase())
            );
            if (!hasTags) return;
          }

          if (max_price !== undefined && item.price > max_price) return;

          results.push({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description
          });
        });
      });

      return {
        result: { items: results.slice(0, 10), count: results.length },
        session: updatedSession
      };
    }

    case 'set_dietary_restrictions': {
      const { allergens = [], dietary_prefs = [] } = args;
      updatedSession.allergyRestrictions = allergens;
      updatedSession.dietaryPreferences = dietary_prefs;

      return {
        result: {
          success: true,
          allergens: updatedSession.allergyRestrictions,
          dietary_prefs: updatedSession.dietaryPreferences
        },
        session: updatedSession
      };
    }

    default:
      return { result: { error: 'Unknown function' }, session };
  }
}

export async function processAIMessage(
  userMessage: string,
  session: SessionState
): Promise<{ reply: string; session: SessionState }> {
  
  const systemPrompt = `${RESTAURANT_CONFIG.prompts.systemPrompt}

IMPORTANT RULES:
- You must ONLY recommend items that exist in the menu below
- NEVER make up items that aren't in the menu
- When a customer has allergens, filter ALL recommendations to exclude those allergens
- Be persuasive but honest about what we offer
- Use function calling for ALL cart operations

Available allergens in our menu: ${Array.from(ALL_ALLERGENS).join(', ')}

COMPLETE MENU:
${JSON.stringify(getMenuForAI(), null, 2)}

${session.allergyRestrictions.length > 0 ? `\\nCUSTOMER ALLERGENS TO AVOID: ${session.allergyRestrictions.join(', ')}` : ''}
${session.dietaryPreferences.length > 0 ? `\\nCUSTOMER DIETARY PREFERENCES: ${session.dietaryPreferences.join(', ')}` : ''}
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        functions,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    let assistantReply = '';
    let updatedSession = { ...session, conversationHistory: [...session.conversationHistory] };

    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments || '{}');

      const functionResult = executeFunctionCall(functionName, functionArgs, updatedSession);
      updatedSession = functionResult.session;

      updatedSession.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'function', name: functionName, content: JSON.stringify(functionResult.result) }
      );

      // Get natural language response
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedSession.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        assistantReply = followUpData.choices[0].message.content || 'Done!';
      } else {
        assistantReply = 'Done!';
      }
    } else {
      assistantReply = choice.message.content || 'I can help you order from our menu!';
      updatedSession.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantReply }
      );
    }

    if (updatedSession.conversationHistory.length > 20) {
      updatedSession.conversationHistory = updatedSession.conversationHistory.slice(-20);
    }

    return {
      reply: assistantReply,
      session: updatedSession
    };

  } catch (error: any) {
    console.error('OpenAI Error:', error);
    return {
      reply: "I apologize, I'm having trouble processing that right now. Could you try again?",
      session
    };
  }
}
