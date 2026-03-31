import type { Request, Response, NextFunction } from "express";
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare function notFound(req: Request, res: Response): void;
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
//# sourceMappingURL=errors.d.ts.map