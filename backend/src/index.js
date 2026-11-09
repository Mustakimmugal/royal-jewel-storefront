import mongoose from "mongoose";
import { app } from "./app.js";
import { config } from "./config.js";
import { User } from "./models/User.js";

try {
  await mongoose.connect(config.mongoUri, { autoIndex: false });
  const userIndexes = await User.collection.indexes();
  const oldPhoneIndex = userIndexes.find((index) => index.key?.phone === 1 && index.unique && !index.partialFilterExpression);
  if (oldPhoneIndex) await User.collection.dropIndex(oldPhoneIndex.name);
  await Promise.all(mongoose.modelNames().map((modelName) => mongoose.model(modelName).createIndexes()));
  app.listen(config.port, () => {
    console.info(JSON.stringify({ event: "api.started", port: config.port, environment: config.nodeEnv }));
  });
} catch (error) {
  console.error(JSON.stringify({ event: "api.start_failed", name: error.name || "Error", code: error.code || "STARTUP_FAILED" }));
  process.exit(1);
}
