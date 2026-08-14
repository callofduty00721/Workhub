import { refundExpiredVerifications } from "../modules/startup/investment.controller.js";
import { logger } from "../utils/logger.js";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export function startInvestmentRefundJob(app) {
  const run = () => {
    refundExpiredVerifications(app).catch((err) => logger.error("Investment refund job failed", { error: err.message }));
  };

  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
