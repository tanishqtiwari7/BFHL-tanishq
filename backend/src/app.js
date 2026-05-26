import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bfhlRoutes from "./routes/bfhl.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/bfhl", bfhlRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    is_success: false,
    error: "Internal server error",
  });
});

export default app;
