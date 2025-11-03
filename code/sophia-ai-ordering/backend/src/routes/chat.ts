import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { RESTAURANT_CONFIG, MENU_LOOKUP } from "../data/menu.js";
import { processAIMessage, type SessionState } from "../services/openai.js";

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string()
});

const sessions = new Map<string, SessionState>();

export async function chatRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof chatSchema> }>(
    "/api/chat",
    async (request: FastifyRequest<{ Body: z.infer<typeof chatSchema> }>, reply: FastifyReply) => {
      try {
        const { message, sessionId } = chatSchema.parse(request.body);
        
        // Get or create session
        let session = getSession(sessionId);
        
        // Process message with AI
        const result = await processAIMessage(message, session);
        
        // Update session
        sessions.set(sessionId, result.session);
        
        // Format cart for response
        const cart = formatCart(result.session.cart);

        return reply.send({
          reply: result.reply,
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

      // Format config for frontend
      const config = {
        restaurantInfo: {
          name: RESTAURANT_CONFIG.restaurantInfo.name,
          location: RESTAURANT_CONFIG.restaurantInfo.location,
          phone: RESTAURANT_CONFIG.restaurantInfo.phone,
          tagline: "Hand-crafted peri peri chicken, burgers, and crowd-pleasing sides.",
          hours: Object.entries(RESTAURANT_CONFIG.restaurantInfo.hours)
            .map(([day, hours]) => `${day}: ${hours}`)
            .join(' | ')
        },
        highlights: [
          "Freshly grilled Peri Peri chicken in multiple heat levels",
          "Prime beef burgers with artisan buns",
          "Family-friendly combos and vegetarian options",
          "Quick service with quality ingredients"
        ],
        categories: RESTAURANT_CONFIG.menu.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          items: cat.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description || '',
            allergens: item.allergens || [],
            tags: item.tags || []
          }))
        })),
        prompts: {
          welcomeMessage: RESTAURANT_CONFIG.prompts.welcomeMessage,
          suggestMessage: "Our chefs recommend trying our signature Peri Peri dishes or our popular burgers!"
        }
      };

      return reply.send(config);
    }
  );
}

function getSession(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      cart: {},
      conversationHistory: [],
      allergyRestrictions: [],
      dietaryPreferences: []
    });
  }
  return sessions.get(sessionId)!;
}

function formatCart(cartRecord: Record<string, number>) {
  const items = Object.entries(cartRecord)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => {
      const item = MENU_LOOKUP[itemId];
      const lineTotal = parseFloat((item.price * quantity).toFixed(2));
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        total: lineTotal
      };
    });

  const total = items.reduce((acc, item) => acc + item.total, 0);

  return {
    items,
    total: parseFloat(total.toFixed(2)),
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0)
  };
}
