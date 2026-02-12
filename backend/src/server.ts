import "newrelic";
import app from "./app";
import { pool } from "./config/db";
import { redis } from "./config/redis";

const PORT = 8000;

async function startServer() {
    try {
      await pool.connect();
      console.log("Database connected successfully");
  
      await redis.ping();
      console.log("Redis connected successfully");
  
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
  
    } catch (error) {
      console.error("Startup failed", error);
    }
  }

startServer();
