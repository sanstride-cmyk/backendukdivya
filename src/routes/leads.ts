import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../lib/db.js";
import { leads, insertLeadSchema } from "../schema/index.js";
import { sendLeadNotification } from "../services/email.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /api/leads — Capture a lead (popup, chatbot, etc.)
router.post("/", contactLimiter, async (req: Request, res: Response) => {
  const parsed = insertLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      error: "Validation Error",
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const data = parsed.data;
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "";

  const [lead] = await db
    .insert(leads)
    .values({ ...data, ipAddress })
    .returning();

  // Fire email async
  sendLeadNotification({
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
    service: data.interestedService ?? undefined,
    source: data.source,
  })
    .then((sent) => {
      if (sent) {
        db.update(leads)
          .set({ emailSent: true })
          .where(eq(leads.id, lead.id))
          .execute()
          .catch((e) => logger.error(e, "Failed to update lead emailSent"));
      }
    })
    .catch((e) => logger.error(e, "Lead email error"));

  logger.info({ id: lead.id, source: data.source, email: data.email }, "Lead captured");

  return res.status(201).json({
    success: true,
    message: "Thanks! Our team will contact you within 24 hours.",
    data: { id: lead.id },
  });
});

// GET /api/leads — List all leads
router.get("/", async (_req: Request, res: Response) => {
  const allLeads = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return res.json({
    success: true,
    data: allLeads,
    count: allLeads.length,
  });
});

// PATCH /api/leads/:id/status — Update lead status
router.patch("/:id/status", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };

  const validStatuses = ["new", "contacted", "qualified", "converted", "lost"] as const;
  if (!validStatuses.includes(status as any)) {
    return res.status(422).json({
      success: false,
      error: "Invalid status. Must be one of: " + validStatuses.join(", "),
    });
  }

  const [updated] = await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();

  if (!updated) {
    return res.status(404).json({ success: false, error: "Lead not found" });
  }

  return res.json({ success: true, data: updated });
});

export default router;
