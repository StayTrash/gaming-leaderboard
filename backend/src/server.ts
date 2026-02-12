import app from "./app";
import { pool } from "./config/db";

const PORT = 8000;

async function startServer() {
  try {
    await pool.connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
  }
}

startServer();
