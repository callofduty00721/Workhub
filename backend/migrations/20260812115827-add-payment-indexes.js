// payment.model.js already declares these two indexes via
// paymentSchema.index(...), which Mongoose creates automatically on connect
// (autoIndex defaults to true). This migration makes that explicit and
// tracked instead of implicit — the moment autoIndex is turned off for
// production (the usual recommendation, since building an index on every
// boot is wasted work once the schema is stable), these become the only
// thing that actually creates them. createIndex is idempotent, so this is
// safe to run even though the indexes likely already exist.
export const up = async (db) => {
  await db.collection("payments").createIndex({ payer: 1, status: 1 });
  await db.collection("payments").createIndex({ payee: 1, status: 1, escrowStatus: 1 });
};

export const down = async (db) => {
  await db.collection("payments").dropIndex({ payer: 1, status: 1 });
  await db.collection("payments").dropIndex({ payee: 1, status: 1, escrowStatus: 1 });
};
