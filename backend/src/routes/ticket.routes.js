import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  getStats,
  listTickets,
  updateTicket,
} from "../controllers/ticket.controller.js";

const router = Router();

router.post("/", createTicket);
router.get("/", listTickets);
router.get("/stats", getStats);
router.patch("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;
