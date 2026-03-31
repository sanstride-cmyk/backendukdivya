import { Router } from "express";
import healthRouter from "./health.js";
import contactRouter from "./contact.js";
import leadsRouter from "./leads.js";
import chatRouter from "./chat.js";

const router = Router();

router.use(healthRouter);
router.use("/contact", contactRouter);
router.use("/leads", leadsRouter);
router.use("/chat", chatRouter);

export default router;
