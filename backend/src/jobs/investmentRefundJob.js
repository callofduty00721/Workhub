import { refundExpiredVerifications } from "../controllers/investmentController.js";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export function startInvestmentRefundJob(app) {
  const run = () => {
    refundExpiredVerifications(app).catch((err) => console.error("Investment refund job failed:", err.message));
  };

  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
