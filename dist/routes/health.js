import { Router } from "express";
import { pool } from "../lib/db.js";
const router = Router();
router.get("/healthz", async (_req, res) => {
    let dbOk = false;
    try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
        dbOk = true;
    }
    catch {
        dbOk = false;
    }
    const status = dbOk ? "ok" : "degraded";
    res.status(dbOk ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        services: {
            database: dbOk ? "ok" : "error",
        },
    });
});
export default router;
//# sourceMappingURL=health.js.map