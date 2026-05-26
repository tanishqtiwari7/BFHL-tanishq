import { Router } from "express";
import { getBfhl, postBfhl } from "../controllers/bfhl.controller.js";

const router = Router();

router.get("/", getBfhl);
router.post("/", postBfhl);

export default router;
