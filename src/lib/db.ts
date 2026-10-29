import "server-only";
import mariadb, { type Pool } from "mariadb";

function requiredEnv(name: string): string {
  const value = process.env[name];

  // อนุญาตให้ DB_PASSWORD เป็นสตริงว่างได้
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createDatabasePool(): Pool {
  const port = Number(process.env.DB_PORT ?? "3306");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be a valid port number");
  }

  return mariadb.createPool({
    host: requiredEnv("DB_HOST"),
    port,
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    connectionLimit: 5,
    charset: "utf8mb4",
    multipleStatements: false,
  });
}

const globalForDb = globalThis as typeof globalThis & {
  hrDbPool?: Pool;
};

export const db =
  globalForDb.hrDbPool ?? createDatabasePool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.hrDbPool = db;
}
