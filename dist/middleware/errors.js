import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
export class AppError extends Error {
    statusCode;
    message;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = "AppError";
    }
}
export function notFound(req, res) {
    res.status(404).json({
        success: false,
        error: "Not Found",
        message: `Route ${req.method} ${req.path} not found`,
    });
}
export function errorHandler(err, req, res, _next) {
    // Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        return res.status(422).json({
            success: false,
            error: "Validation Error",
            errors,
        });
    }
    // Application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.code || "Error",
            message: err.message,
        });
    }
    // Unexpected errors
    logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
    return res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "production"
            ? "Something went wrong. Please try again."
            : err.message,
    });
}
//# sourceMappingURL=errors.js.map