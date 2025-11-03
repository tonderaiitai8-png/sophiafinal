import Fastify from "fastify";
import cors from "@fastify/cors";
import { chatRoute } from "./routes/chat.js";
const fastify = Fastify({ logger: true });
await fastify.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"]
});
fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString()
}));
await fastify.register(chatRoute);
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "3000");
        await fastify.listen({ port, host: "0.0.0.0" });
        console.log(`🚀 Backend running on http://localhost:${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
