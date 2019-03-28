module.exports = {
  DATABASE_URL:
    "mongodb://new-user_31:mAjvihUkOLbGAsvX@cluster0-shard-00-00-jndlt.mongodb.net:27017,cluster0-shard-00-01-jndlt.mongodb.net:27017,cluster0-shard-00-02-jndlt.mongodb.net:27017/staes_be?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true",
  DATABASE_NAME: "ex-horse",
  COLLECTIONS: {
    META: "meta",
    EVENTS: "events",
    SNAPSHOT: "snapshot"
  },
  JWT_SECRET: "acqua-in-bocca",
  SNAPSHOT_TRIGGER: 1
}
