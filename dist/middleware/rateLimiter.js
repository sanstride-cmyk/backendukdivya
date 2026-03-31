import rateLimit from "express-rate-limit";
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
export const globalLimiter = rateLimit({
    windowMs,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many requests from this IP. Please try again later.",
    },
});
// Strict limiter for form submissions (5 per 15 min per IP)
export const contactLimiter = rateLimit({
    windowMs,
    max: Number(process.env.CONTACT_RATE_LIMIT_MAX) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many form submissions. Please wait before trying again.",
    },
});
//# sourceMappingURL=rateLimiter.js.map