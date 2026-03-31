import { Router } from "express";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/db.js";
import { chatSessions, leads } from "../schema/index.js";
import { sendLeadNotification } from "../services/email.js";
import { logger } from "../lib/logger.js";
const router = Router();
// POST /api/chat/session — Create or update chat session
router.post("/session", async (req, res) => {
    const { sessionId, name, email, phone, interestedService } = req.body;
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "";
    if (sessionId) {
        // Update existing session
        const [existing] = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.sessionId, sessionId))
            .limit(1);
        if (existing) {
            const [updated] = await db
                .update(chatSessions)
                .set({
                ...(name && { name }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(interestedService && { interestedService }),
                updatedAt: new Date(),
            })
                .where(eq(chatSessions.sessionId, sessionId))
                .returning();
            return res.json({ success: true, data: updated });
        }
    }
    // Create new session
    const newSessionId = sessionId || uuidv4();
    const [session] = await db
        .insert(chatSessions)
        .values({ sessionId: newSessionId, name, email, phone, interestedService, ipAddress })
        .returning();
    return res.status(201).json({ success: true, data: session });
});
// POST /api/chat/complete — Mark session as done, convert to lead
router.post("/complete", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(422).json({ success: false, error: "sessionId is required" });
    }
    const [session] = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.sessionId, sessionId))
        .limit(1);
    if (!session) {
        return res.status(404).json({ success: false, error: "Session not found" });
    }
    if (!session.email && !session.phone) {
        return res.status(422).json({
            success: false,
            error: "Cannot complete session without email or phone",
        });
    }
    // Mark session complete
    await db
        .update(chatSessions)
        .set({ completed: true, updatedAt: new Date() })
        .where(eq(chatSessions.sessionId, sessionId));
    // Convert to lead if has email
    if (session.email && session.name) {
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.ip ||
            "";
        const [lead] = await db
            .insert(leads)
            .values({
            name: session.name,
            email: session.email,
            phone: session.phone || undefined,
            interestedService: session.interestedService || undefined,
            source: "chatbot",
            ipAddress,
        })
            .returning();
        sendLeadNotification({
            name: session.name,
            email: session.email,
            phone: session.phone || undefined,
            service: session.interestedService || undefined,
            source: "chatbot",
        }).catch((e) => logger.error(e, "Chatbot lead email failed"));
        logger.info({ leadId: lead.id, sessionId }, "Chatbot lead converted");
        return res.json({
            success: true,
            message: "Lead captured from chatbot session",
            data: { leadId: lead.id },
        });
    }
    return res.json({ success: true, message: "Session marked complete" });
});
export default router;
//# sourceMappingURL=chat.js.map