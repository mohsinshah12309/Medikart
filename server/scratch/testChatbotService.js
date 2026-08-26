/**
 * Debugging script for chatbot service
 */
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../../server/.env") });

const { getOtcSuggestions } = require("../../server/src/modules/chatbot/chatbot.service");

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  console.log("Connecting to MONGODB_URI:", mongoUri ? "Configured" : "Missing");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  try {
    console.log("Calling getOtcSuggestions...");
    const result = await getOtcSuggestions("127.0.0.1", null, "I have a headache.");
    console.log("Success! Result:", result);
  } catch (err) {
    console.error("Error caught in debug script:");
    console.error(err);
    if (err.status) console.error("Error Status:", err.status);
    if (err.statusCode) console.error("Error StatusCode:", err.statusCode);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(console.error);
