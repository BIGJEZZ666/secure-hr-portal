import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import mariadb from "mariadb";

loadEnvConfig(process.cwd());

function requiredEnv(name) {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.DB_PORT ?? "3306");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be a valid port number");
}

const pool = mariadb.createPool({
  host: requiredEnv("DB_HOST"),
  port,
  database: requiredEnv("DB_NAME"),
  user: requiredEnv("DB_USER"),
  password: requiredEnv("DB_PASSWORD"),
  connectionLimit: 1,
  charset: "utf8mb4",
  multipleStatements: false,
});

try {
  const rows = await pool.query(
    "SELECT DATABASE() AS databaseName, VERSION() AS version"
  );

  console.log("Database:", rows[0].databaseName);
  console.log("MariaDB version:", rows[0].version);

  const tables = await pool.query("SHOW TABLES");

  console.log("Number of tables:", tables.length);
  console.log(
    "Tables:",
    tables.map((row) => Object.values(row)[0])
  );
} catch (error) {
  console.error("Database connection test failed.");
  console.error("Error code:", error.code ?? "UNKNOWN");
  console.error("Message:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
