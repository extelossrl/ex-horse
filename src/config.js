module.exports = {
  DATABASE_URL: "mongodb://localhost:27017/ex-horse",
  DATABASE_NAME: "ex-horse",
  EVENTSTORE_COLLECTIONS: {
    events: "events",
    snapshots: "snapshots",
    transactions: "transactions"
  },
  JWT_SECRET: "acqua-in-bocca",
  SNAPSHOT_INTERVAL: 10 * 60 * 1000
};
