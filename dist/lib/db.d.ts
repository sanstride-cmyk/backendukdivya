import * as schema from "../schema/index.js";
export declare const pool: import("pg").Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema>;
export declare function testConnection(): Promise<boolean>;
//# sourceMappingURL=db.d.ts.map