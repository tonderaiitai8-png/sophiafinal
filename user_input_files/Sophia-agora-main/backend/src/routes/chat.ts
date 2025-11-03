import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  KEYWORDS_TO_ITEM,
  MENU_LOOKUP,
  RESTAURANT_CONFIG,
  type MenuItem
} from "../data/menu.js";

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string()
});

type SessionState = {
  cart: Record<string, number>;
};

const sessions = new Map<string, SessionState>();

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

export async function chatRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof chatSchema> }>(
    "/api/chat",
    async (request: FastifyRequest<{ Body: z.infer<typeof chatSchema> }>, reply: FastifyReply) => {
      try {
        const { message, sessionId } = chatSchema.parse(request.body);
        const { reply: assistantReply, cart } = processMessage(message, sessionId);

        return reply.send({
          reply: assistantReply,
          cart,
          sessionId
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(400).send({ error: err.message });
      }
    }
  );

  fastify.get(
    "/api/config/:restaurantId",
    async (
      request: FastifyRequest<{ Params: { restaurantId: string } }>,
      reply: FastifyReply
    ) => {
      if (request.params.restaurantId !== "woodys") {
        return reply.status(404).send({ error: "Restaurant not found" });
      }

      return reply.send(RESTAURANT_CONFIG);
    }
  );
}

function processMessage(message: string, sessionId: string) {
  const session = getSession(sessionId);
  const lower = message.toLowerCase();

  if (lower.includes("clear") && (lower.includes("cart") || lower.includes("order"))) {
    session.cart = {};
    return {
      reply: "No problem — I've cleared your cart. Fancy starting a fresh order?",
      cart: formatCart(session.cart)
    };
  }

  const itemId = findItemId(lower);

  if (itemId) {
    if (/remove|delete|without|minus|take off/.test(lower)) {
      return handleRemoval(session, itemId, lower);
    }

    if (/add|order|want|get|have|take|need/.test(lower)) {
      return handleAddition(session, itemId, lower);
    }
  }

  if (lower.includes("recommend") || lower.includes("suggest")) {
    return {
      reply: `${RESTAURANT_CONFIG.prompts.suggestMessage} Would you like me to add one of those to your cart?`,
      cart: formatCart(session.cart)
    };
  }

  if (lower.includes("cart") || lower.includes("order") || lower.includes("total")) {
    return summarizeCart(session);
  }

  if (lower.includes("thanks") || lower.includes("thank you")) {
    return {
      reply: "You're very welcome! If you need anything else, just let me know.",
      cart: formatCart(session.cart)
    };
  }

  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    return {
      reply: `${RESTAURANT_CONFIG.prompts.welcomeMessage} Ask me to add any dish by name and I'll pop it in your cart.`,
      cart: formatCart(session.cart)
    };
  }

  return {
    reply:
      "I can help you build an order from our menu. Tap on an item or ask me to add a dish like \"Add the Hot Stuff burger\".",
    cart: formatCart(session.cart)
  };
}

function getSession(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { cart: {} });
  }
  return sessions.get(sessionId)!;
}

function findItemId(lowerMessage: string): string | null {
  for (const [keyword, itemId] of Object.entries(KEYWORDS_TO_ITEM)) {
    if (lowerMessage.includes(keyword)) {
      return itemId;
    }
  }
  return null;
}

function detectQuantity(lowerMessage: string): number {
  const numericMatch = lowerMessage.match(/(\d+)/);
  if (numericMatch) {
    const parsed = parseInt(numericMatch[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  for (const [word, value] of Object.entries(numberWords)) {
    if (lowerMessage.includes(word)) {
      return value;
    }
  }

  if (lowerMessage.includes("couple")) {
    return 2;
  }

  return 1;
}

function handleAddition(session: SessionState, itemId: string, lowerMessage: string) {
  const quantity = detectQuantity(lowerMessage);
  session.cart[itemId] = (session.cart[itemId] ?? 0) + quantity;
  const item = MENU_LOOKUP[itemId];

  return {
    reply: `Great choice! I've added ${quantity} x ${item.name} to your cart. Anything else to go with it?`,
    cart: formatCart(session.cart)
  };
}

function handleRemoval(session: SessionState, itemId: string, lowerMessage: string) {
  if (!session.cart[itemId]) {
    const item = MENU_LOOKUP[itemId];
    return {
      reply: `It looks like there aren't any ${item.name} in your cart yet. Want me to add one?`,
      cart: formatCart(session.cart)
    };
  }

  const quantity = detectQuantity(lowerMessage);
  session.cart[itemId] = Math.max(0, (session.cart[itemId] ?? 0) - quantity);

  if (session.cart[itemId] === 0) {
    delete session.cart[itemId];
  }

  const item = MENU_LOOKUP[itemId];
  return {
    reply: `All sorted — I've removed ${quantity} x ${item.name}. Anything else you'd like to adjust?`,
    cart: formatCart(session.cart)
  };
}

function summarizeCart(session: SessionState) {
  const cart = formatCart(session.cart);

  if (cart.items.length === 0) {
    return {
      reply: "Your cart is empty right now. Add something tasty and I'll keep track for you!",
      cart
    };
  }

  const summary = cart.items
    .map((item) => `${item.quantity} x ${item.name}`)
    .join(", ");

  return {
    reply: `You currently have ${summary} for a total of £${cart.total.toFixed(2)}. Ready to checkout or add more?`,
    cart
  };
}

function formatCart(cartRecord: Record<string, number>) {
  const items = Object.entries(cartRecord)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => toCartItem(MENU_LOOKUP[itemId], quantity));

  const total = items.reduce((acc, item) => acc + item.total, 0);

  return {
    items,
    total,
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0)
  };
}

function toCartItem(item: MenuItem, quantity: number) {
  const lineTotal = parseFloat((item.price * quantity).toFixed(2));
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    quantity,
    total: lineTotal
  };
}
