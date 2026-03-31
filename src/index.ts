import "dotenv/config";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { testConnection } from "./lib/db.js";

const port = Number(process.env.PORT) || 3000;

if (isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT: "${process.env.PORT}"`);
}

async function bootstrap() {
  // Test DB connection (non-fatal in dev)
  const dbOk = await testConnection();
  if (!dbOk && process.env.NODE_ENV === "production") {
    logger.error("Cannot start without database in production");
    process.exit(1);
  }

  const server = app.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV }, "🚀 Server started");
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully...");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled rejection");
    process.exit(1);
  });
}

bootstrap();
