import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { startInvestmentRefundJob } from "./jobs/investmentRefundJob.js";
import { startDisputeEscalationJob } from "./jobs/disputeEscalationJob.js";
import { initSentry } from "./config/sentry.js";
import { logger } from "./utils/logger.js";

initSentry();

const PORT = process.env.PORT || 5000;
// Must stay comfortably under whatever grace period the orchestrator gives a
// container between SIGTERM and SIGKILL (Docker's default is 10s, k8s's is
// 30s) — if this timer loses the race, in-flight requests get killed
// mid-response instead of finishing cleanly, which is the exact thing this
// is meant to prevent.
const SHUTDOWN_TIMEOUT_MS = 8000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);
  app.set("io", io);

  httpServer.listen(PORT, () => {
    logger.info(`GrowHive API running on http://localhost:${PORT}`);
  });

  startInvestmentRefundJob(app);
  startDisputeEscalationJob(app);

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);

    const forceExitTimer = setTimeout(() => {
      logger.error(`Graceful shutdown did not finish within ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    // io.close() stops new connections AND closes the underlying httpServer
    // it was attached to (socket.io v4 behavior) — existing in-flight HTTP
    // requests are allowed to finish (keep-alive connections drain) before
    // the callback fires; open WebSocket connections are dropped immediately
    // (socket.io clients auto-reconnect, so this is fine).
    io.close(async () => {
      logger.info("HTTP/WebSocket server closed");
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
      } catch (err) {
        logger.error("Error closing MongoDB connection", { error: err.message });
      }
      clearTimeout(forceExitTimer);
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  logger.error("Failed to start server", { error: err.stack || err.message });
  process.exit(1);
});
