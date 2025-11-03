import json

# Read restaurant config
with open('/workspace/user_input_files/restaurant-config.json', 'r') as f:
    config = json.load(f)

# Create the edge function with embedded config
edge_function_code = '''// Sophia AI Restaurant Ordering System - Production Edge Function
// Full OpenAI GPT-4 Turbo Integration with 200+ Menu Items

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, sessionId, cart = {}, conversationHistory = [], allergyRestrictions = [], dietaryPreferences = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Complete restaurant configuration with 200+ items
    const RESTAURANT_CONFIG = ''' + json.dumps(config) + ''';

    // Build menu lookup
    const MENU_LOOKUP = {};
    const ALL_ALLERGENS = new Set();
    
    RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        MENU_LOOKUP[item.id] = { ...item, category: cat.name };
        if (item.allergens) {
          item.allergens.forEach((allergen) => ALL_ALLERGENS.add(allergen));
        }
      });
    });

    // Function definitions for OpenAI
    const functions = [
      {
        name: 'add_to_cart',
        description: 'Add an item to the customer\\\\'s cart. Use this when the customer wants to order something.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'The ID of the menu item to add' },
            quantity: { type: 'number', description: 'The quantity to add (default 1)', default: 1 }
          },
          required: ['item_id']
        }
      },
      {
        name: 'remove_from_cart',
        description: 'Remove an item from the customer\\\\'s cart or reduce its quantity.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'The ID of the menu item to remove' },
            quantity: { type: 'number', description: 'The quantity to remove (default: all)', default: -1 }
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
        description: 'Search the menu for items matching criteria like allergens, dietary preferences, or price range.',
        parameters: {
          type: 'object',
          properties: {
            exclude_allergens: { type: 'array', items: { type: 'string' }, description: 'Allergens to exclude from results' },
            dietary_tags: { type: 'array', items: { type: 'string' }, description: 'Dietary tags to filter by (e.g., vegan, vegetarian, gluten-free)' },
            max_price: { type: 'number', description: 'Maximum price for items' }
          }
        }
      },
      {
        name: 'set_dietary_restrictions',
        description: 'Record customer\\\\'s allergy or dietary restrictions for the session.',
        parameters: {
          type: 'object',
          properties: {
            allergens: { type: 'array', items: { type: 'string' }, description: 'List of allergens to avoid' },
            dietary_prefs: { type: 'array', items: { type: 'string' }, description: 'Dietary preferences like vegan, vegetarian, etc.' }
          }
        }
      }
    ];

    // Build system prompt
    const systemPrompt = `${RESTAURANT_CONFIG.prompts.systemPrompt}

IMPORTANT RULES:
- You must ONLY recommend items that exist in the menu below
- NEVER make up items that aren't in the menu
- When a customer has allergens, filter ALL recommendations to exclude those allergens
- Be persuasive but honest about what we offer
- Use function calling for ALL cart operations

Available allergens in our menu: ${Array.from(ALL_ALLERGENS).join(', ')}

COMPLETE MENU:
${JSON.stringify(RESTAURANT_CONFIG.menu.categories.map((cat) => ({
      category: cat.name,
      items: cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        allergens: item.allergens || [],
        tags: item.tags || []
      }))
    })), null, 2)}

${allergyRestrictions.length > 0 ? `\\nCUSTOMER ALLERGENS TO AVOID: ${allergyRestrictions.join(', ')}` : ''}
${dietaryPreferences.length > 0 ? `\\nCUSTOMER DIETARY PREFERENCES: ${dietaryPreferences.join(', ')}` : ''}
`;

    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
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

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const choice = openaiData.choices[0];
    
    let assistantReply = '';
    let updatedCart = { ...cart };
    let updatedAllergyRestrictions = [...allergyRestrictions];
    let updatedDietaryPreferences = [...dietaryPreferences];
    let updatedHistory = [...conversationHistory];

    // Handle function calls
    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments || '{}');

      // Execute function
      let functionResult;
      
      switch (functionName) {
        case 'add_to_cart': {
          const { item_id, quantity = 1 } = functionArgs;
          const item = MENU_LOOKUP[item_id];
          
          if (!item) {
            functionResult = { error: 'Item not found' };
          } else {
            updatedCart[item_id] = (updatedCart[item_id] || 0) + quantity;
            functionResult = {
              success: true,
              item: item.name,
              quantity,
              new_total: updatedCart[item_id],
              price: item.price
            };
          }
          break;
        }

        case 'remove_from_cart': {
          const { item_id, quantity = -1 } = functionArgs;
          const item = MENU_LOOKUP[item_id];
          
          if (!item || !updatedCart[item_id]) {
            functionResult = { error: 'Item not in cart' };
          } else {
            if (quantity === -1 || updatedCart[item_id] <= quantity) {
              delete updatedCart[item_id];
            } else {
              updatedCart[item_id] -= quantity;
            }
            functionResult = { success: true, item: item.name, removed: true };
          }
          break;
        }

        case 'clear_cart': {
          updatedCart = {};
          functionResult = { success: true, message: 'Cart cleared' };
          break;
        }

        case 'search_menu': {
          const { exclude_allergens = [], dietary_tags = [], max_price } = functionArgs;
          const results = [];
          
          RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
            cat.items.forEach((item) => {
              // Check allergens
              if (exclude_allergens.length > 0) {
                const hasAllergen = item.allergens?.some((a) => 
                  exclude_allergens.some((ea) => a.toLowerCase().includes(ea.toLowerCase()))
                );
                if (hasAllergen) return;
              }

              // Check dietary tags
              if (dietary_tags.length > 0) {
                const hasTags = dietary_tags.every((tag) =>
                  item.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
                );
                if (!hasTags) return;
              }

              // Check price
              if (max_price !== undefined && item.price > max_price) return;

              results.push({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description
              });
            });
          });

          functionResult = { items: results.slice(0, 10), count: results.length };
          break;
        }

        case 'set_dietary_restrictions': {
          const { allergens = [], dietary_prefs = [] } = functionArgs;
          updatedAllergyRestrictions = allergens;
          updatedDietaryPreferences = dietary_prefs;
          functionResult = {
            success: true,
            allergens: updatedAllergyRestrictions,
            dietary_prefs: updatedDietaryPreferences
          };
          break;
        }

        default:
          functionResult = { error: 'Unknown function' };
      }

      // Add function call to history
      updatedHistory.push(
        { role: 'user', content: message },
        { role: 'function', name: functionName, content: JSON.stringify(functionResult) }
      );

      // Get natural language response
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedHistory
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
      updatedHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: assistantReply }
      );
    }

    // Keep history manageable
    if (updatedHistory.length > 20) {
      updatedHistory = updatedHistory.slice(-20);
    }

    // Calculate cart summary
    const cartItems = Object.entries(updatedCart).map(([itemId, quantity]) => {
      const item = MENU_LOOKUP[itemId];
      return item ? {
        id: itemId,
        name: item.name,
        price: item.price,
        quantity,
        total: item.price * quantity
      } : null;
    }).filter(Boolean);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    return new Response(JSON.stringify({
      data: {
        reply: assistantReply,
        cart: updatedCart,
        cartItems,
        cartTotal,
        conversationHistory: updatedHistory,
        allergyRestrictions: updatedAllergyRestrictions,
        dietaryPreferences: updatedDietaryPreferences
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat AI error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'CHAT_AI_ERROR',
        message: error.message || 'An error occurred processing your message'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
'''

# Write the edge function
with open('/workspace/supabase/functions/chat-ai/index.ts', 'w') as f:
    f.write(edge_function_code)

print("Edge function created successfully with embedded restaurant config")
print(f"Function size: {len(edge_function_code)} characters")
