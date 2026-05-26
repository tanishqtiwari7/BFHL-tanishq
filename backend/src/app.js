import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ticketRoutes from "./routes/ticket.routes.js";

dotenv.config();

const app = express();

const corsOrigin = process.env.CLIENT_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use("/tickets", ticketRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

export default app;
