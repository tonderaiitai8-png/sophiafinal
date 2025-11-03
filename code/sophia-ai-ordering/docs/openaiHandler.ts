// backend/src/services/openaiHandler.ts
// Menu-locked OpenAI handler with function calling

import OpenAI from "openai";
import type { Session, Restaurant } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract all menu item IDs from restaurant config
 * Used to build the function calling enum
 */
function getAllMenuItemIds(restaurant: Restaurant): string[] {
  const itemIds: string[] = [];

  if (restaurant.categories && Array.isArray(restaurant.categories)) {
    for (const category of restaurant.categories) {
      if (category.items && Array.isArray(category.items)) {
        for (const item of category.items) {
          itemIds.push(item.id);
        }
      }
    }
  }

  return itemIds;
}

/**
 * Build a strict system prompt anchored to ONLY the restaurant's menu
 */
function buildSystemPrompt(restaurant: Restaurant): string {
  const itemsList = restaurant.categories
    .flatMap((cat) => `${cat.name}: ${cat.items.map((i) => `${i.name} (£${i.price})`).join(", ")}`)
    .join("\n");

  return `${restaurant.prompts?.systemPrompt || "You are a helpful ordering assistant."

  }

MENU AVAILABLE AT ${restaurant.restaurantInfo.name}:
${itemsList}

CRITICAL RULES:
1. ONLY recommend items from the above menu
2. NEVER invent items, prices, or ingredients not listed
3. NEVER discuss topics outside food ordering
4. If asked about something off-menu, politely redirect to available items
5. If customer has allergies, carefully filter recommendations
6. Always be friendly and encouraging`;
}

/**
 * Call OpenAI with menu-locked function calling
 * Ensures AI cannot hallucinate items outside menu
 */
export async function callOpenAIMenuLocked(
  message: string,
  session: Session,
  restaurant: Restaurant
): Promise<string> {
  const itemIds = getAllMenuItemIds(restaurant);
  const systemPrompt = buildSystemPrompt(restaurant);

  // Prepare conversation history
  const messages = session.conversation
    .slice(-10) // Last 10 messages for context
    .map((msg) => ({
      role: msg.from === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.text,
    }));

  // Add current user message
  messages.push({
    role: "user" as const,
    content: message,
  });

  // Define function that LOCKS to menu items via enum
  const tools = [
    {
      type: "function" as const,
      function: {
        name: "suggest_menu_item",
        description: "Suggest an item from the restaurant menu to the customer",
        parameters: {
          type: "object" as const,
          properties: {
            item_id: {
              type: "string",
              enum: itemIds, // LOCKED! Can ONLY be these IDs
              description: "The ID of the menu item to suggest",
            },
            reason: {
              type: "string",
              description: "Why you're suggesting this item",
            },
          },
          required: ["item_id", "reason"],
        },
      },
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages as any,
      tools: tools as any,
      tool_choice: "auto",
      max_tokens: 256,
      temperature: 0.7,
    });

    const firstChoice = response.choices[0];

    // If AI called a function, return safe response
    if (firstChoice.message.tool_calls && firstChoice.message.tool_calls.length > 0) {
      const toolCall = firstChoice.message.tool_calls[0];
      if (toolCall.function.name === "suggest_menu_item") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const item = findMenuItemById(restaurant, args.item_id);
          if (item) {
            return `Great choice! ${item.name} is £${item.price}. It's ${item.description.toLowerCase()}. Would you like to add it to your order?`;
          }
        } catch (e) {
          // Fall through to plain text response
        }
      }
    }

    // If no function called, return plain text (menu-safe)
    const textContent = firstChoice.message.content;
    if (textContent && typeof textContent === "string") {
      // Validate response doesn't mention non-menu items
      if (validateResponse(textContent, restaurant)) {
        return textContent;
      }
    }

    // Fallback: Return safe suggestion
    return generateMenuFallback(restaurant);
  } catch (error) {
    console.error("OpenAI error:", error);
    return generateMenuFallback(restaurant);
  }
}

/**
 * Validate that response doesn't mention non-menu items (hallucination check)
 */
function validateResponse(response: string, restaurant: Restaurant): boolean {
  const responseLower = response.toLowerCase();

  // Common food hallucinations to catch
  const hallucinations = [
    "pizza",
    "pasta",
    "sushi",
    "tacos",
    "burritos",
    "kebab",
    "steak",
    "salmon",
    "wine",
    "beer",
    "coffee",
    "tea",
  ];

  for (const hallucination of hallucinations) {
    if (responseLower.includes(hallucination)) {
      // Check if it's actually on the menu
      const isOnMenu = restaurant.categories.some((cat) =>
        cat.items.some((item) =>
          item.name.toLowerCase().includes(hallucination) ||
          item.description.toLowerCase().includes(hallucination)
        )
      );
      if (!isOnMenu) {
        return false; // Hallucination detected
      }
    }
  }

  return true;
}

/**
 * Safe fallback response using menu data
 */
function generateMenuFallback(restaurant: Restaurant): string {
  const categories = restaurant.categories.slice(0, 3);
  const categoryNames = categories.map((c) => c.name).join(", ");

  return `I'm here to help you with ${restaurant.restaurantInfo.name}! We have wonderful options including ${categoryNames} and more. What sounds good to you? 😊`;
}

/**
 * Find a menu item by ID
 */
function findMenuItemById(restaurant: Restaurant, itemId: string) {
  for (const category of restaurant.categories) {
    const item = category.items.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}

export default { callOpenAIMenuLocked };
