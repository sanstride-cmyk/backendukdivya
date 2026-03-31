import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../lib/db.js";
import { contactSubmissions, insertContactSchema, } from "../schema/index.js";
import { sendContactNotification } from "../services/email.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { logger } from "../lib/logger.js";
const router = Router();
// POST /api/contact — Submit contact form
router.post("/", contactLimiter, async (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
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
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "";
    // Save to DB
    const [submission] = await db
        .insert(contactSubmissions)
        .values({
        ...data,
        ipAddress,
        userAgent: req.headers["user-agent"] || "",
    })
        .returning();
    // Send emails async (don't block response)
    sendContactNotification({
        name: data.name,
        email: data.email,
        phone: data.phone ?? undefined,
        message: data.message,
        source: "contact_form",
    })
        .then((sent) => {
        if (sent) {
            db.update(contactSubmissions)
                .set({ emailSent: true })
                .where(eq(contactSubmissions.id, submission.id))
                .execute()
                .catch((e) => logger.error(e, "Failed to update emailSent flag"));
        }
    })
        .catch((e) => logger.error(e, "Email service error"));
    logger.info({ id: submission.id, email: data.email }, "Contact form submitted");
    return res.status(201).json({
        success: true,
        message: "Message received! We'll get back to you within 24 hours.",
        data: { id: submission.id },
    });
});
// GET /api/contact — List all submissions (admin use)
router.get("/", async (_req, res) => {
    const submissions = await db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt))
        .limit(100);
    return res.json({
        success: true,
        data: submissions,
        count: submissions.length,
    });
});
export default router;
//# sourceMappingURL=contact.js.map