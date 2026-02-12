/**
 * Load env and New Relic before any other app code.
 * New Relic must load before express/app for instrumentation; it also requires
 * the license key to be set, so we load dotenv first. If no key is set, we skip
 * New Relic so the server still starts (e.g. local dev without monitoring).
 */
import dotenv from "dotenv";
dotenv.config();

if (process.env.NEW_RELIC_LICENSE_KEY) {
  require("newrelic");
}
