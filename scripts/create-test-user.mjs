import nextEnv from "@next/env";
import mariadb from "mariadb";
import argon2 from "argon2";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

nextEnv.loadEnvConfig(process.cwd());

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const password = process.env.HR_TEST_PASSWORD;

if (!password || password.length < 12 || password.length > 128) {
  console.error("Password must contain 12–128 characters.");
  process.exit(1);
}

const rl = createInterface({ input, output });
let pool;

try {
  const name = (await rl.question("Employee name: ")).trim();
  const email = (await rl.question("Employee email: "))
    .trim()
    .toLowerCase();
  const requestedRole = (
    await rl.question("Role (CEO / HR / EMPLOYEE): ")
  ).trim().toUpperCase();

  if (!name || name.length > 150) {
    throw new Error("Name must contain 1–150 characters.");
  }

  if (!emailPattern.test(email) || email.length > 140) {
    throw new Error("Invalid email or email exceeds 140 characters.");
  }

  if (!["CEO", "HR", "EMPLOYEE"].includes(requestedRole)) {
    throw new Error("Role must be CEO, HR, or EMPLOYEE.");
  }

  if (requestedRole === "CEO") {
    const confirm = (
      await rl.question(
        "CEO has full dashboard permissions. Create this account locally only? (yes/no): ",
      )
    ).trim().toLowerCase();

    if (confirm !== "yes") {
      console.log("Cancelled.");
      process.exitCode = 0;
    } else {
      await createUser(name, email, requestedRole);
    }
  } else {
    await createUser(name, email, requestedRole);
  }
} catch (error) {
  console.error(
    "Account creation failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  rl.close();
  if (pool) await pool.end();
}

async function createUser(name, email, requestedRole) {
  const port = Number(process.env.DB_PORT ?? "3306");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid DB_PORT.");
  }

  pool = mariadb.createPool({
    host: requiredEnv("DB_HOST"),
    port,
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    connectionLimit: 1,
    charset: "utf8mb4",
    multipleStatements: false,
  });

  const existing = await pool.query(
    "SELECT employee_id FROM tb_employee WHERE employee_email = ? LIMIT 1",
    [email],
  );

  if (existing.length > 0) {
    throw new Error("This email already exists. No account was changed.");
  }

  const roles = await pool.query(
    "SELECT role_id FROM tb_role WHERE UPPER(role_name) = ? LIMIT 1",
    [requestedRole],
  );

  if (roles.length !== 1) {
    throw new Error("Requested role was not found in tb_role.");
  }

  const passwordHash = await argon2.hash(
    process.env.HR_TEST_PASSWORD,
    {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    },
  );

  const result = await pool.query(
    `INSERT INTO tb_employee
      (employee_name, employee_email, password, role_id, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name, email, passwordHash, roles[0].role_id],
  );

  console.log("Test account created successfully.");
  console.log("Employee ID:", result.insertId);
  console.log("Role:", requestedRole);
  console.log("Password and hash were not displayed.");
}
