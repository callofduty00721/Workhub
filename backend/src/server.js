import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { startInvestmentRefundJob } from "./jobs/investmentRefundJob.js";
import { startDisputeEscalationJob } from "./jobs/disputeEscalationJob.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);
  app.set("io", io);

  httpServer.listen(PORT, () => {
    console.log(`MahaHub API running on http://localhost:${PORT}`);
  });

  startInvestmentRefundJob(app);
  startDisputeEscalationJob(app);
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
