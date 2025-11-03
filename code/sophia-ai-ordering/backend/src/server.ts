import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { chatRoute } from "./routes/chat.js";

// Load environment variables
dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"]
});

fastify.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  ai_enabled: !!process.env.OPENAI_API_KEY
}));

await fastify.register(chatRoute);

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Backend running on http://localhost:${port}`);
    console.log(`🤖 AI Mode: ${process.env.OPENAI_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
