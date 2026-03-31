import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import router from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
const app = express();
// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.set("trust proxy", 1);
// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length > 0
        ? (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin))
                return cb(null, true);
            cb(new Error(`CORS: origin ${origin} not allowed`));
        }
        : true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// ─── Compression & Parsing ────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(pinoHttp({
    logger,
    serializers: {
        req(req) {
            return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
            return { statusCode: res.statusCode };
        },
    },
}));
// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalLimiter);
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);
// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map