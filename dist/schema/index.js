import { pgTable, serial, text, varchar, timestamp, boolean, pgEnum, index, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// ─── Enums ────────────────────────────────────────────────────────────────────
export const leadSourceEnum = pgEnum("lead_source", [
    "contact_form",
    "popup",
    "chatbot",
    "whatsapp",
    "other",
]);
export const leadStatusEnum = pgEnum("lead_status", [
    "new",
    "contacted",
    "qualified",
    "converted",
    "lost",
]);
// ─── Contact Submissions ──────────────────────────────────────────────────────
export const contactSubmissions = pgTable("contact_submissions", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    message: text("message").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    emailSent: boolean("email_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    emailIdx: index("contact_email_idx").on(table.email),
    createdAtIdx: index("contact_created_at_idx").on(table.createdAt),
}));
export const insertContactSchema = createInsertSchema(contactSubmissions, {
    name: z.string().min(2).max(255).trim(),
    email: z.string().email().max(255).trim().toLowerCase(),
    phone: z.string().max(50).trim().optional(),
    message: z.string().min(10).max(5000).trim(),
}).omit({ id: true, emailSent: true, createdAt: true });
// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    interestedService: varchar("interested_service", { length: 255 }),
    source: leadSourceEnum("source").notNull(),
    status: leadStatusEnum("status").default("new").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    notes: text("notes"),
    emailSent: boolean("email_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    emailIdx: index("lead_email_idx").on(table.email),
    statusIdx: index("lead_status_idx").on(table.status),
    sourceIdx: index("lead_source_idx").on(table.source),
    createdAtIdx: index("lead_created_at_idx").on(table.createdAt),
}));
export const insertLeadSchema = createInsertSchema(leads, {
    name: z.string().min(2).max(255).trim(),
    email: z.string().email().max(255).trim().toLowerCase(),
    phone: z.string().max(50).trim().optional(),
    interestedService: z.string().max(255).trim().optional(),
    source: z.enum(["contact_form", "popup", "chatbot", "whatsapp", "other"]),
}).omit({ id: true, status: true, emailSent: true, createdAt: true, updatedAt: true });
// ─── Chat Sessions ────────────────────────────────────────────────────────────
export const chatSessions = pgTable("chat_sessions", {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 36 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    interestedService: varchar("interested_service", { length: 255 }),
    completed: boolean("completed").default(false).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    sessionIdIdx: index("chat_session_id_idx").on(table.sessionId),
    completedIdx: index("chat_completed_idx").on(table.completed),
}));
export const insertChatSessionSchema = createInsertSchema(chatSessions, {
    sessionId: z.string().uuid(),
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().max(255).trim().toLowerCase().optional(),
    phone: z.string().max(50).trim().optional(),
    interestedService: z.string().max(255).trim().optional(),
}).omit({ id: true, completed: true, createdAt: true, updatedAt: true });
//# sourceMappingURL=index.js.map