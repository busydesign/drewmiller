import { spawnSync } from "node:child_process";

const relatedKeys = Object.keys(process.env)
  .filter((key) => /DATABASE|POSTGRES|PG/i.test(key))
  .sort();

function firstTruthy(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

process.env.DATABASE_URL = firstTruthy(
  process.env.DATABASE_URL,
  process.env.DATABASE_PRIVATE_URL,
  process.env.DATABASE_PUBLIC_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_PRIVATE_URL,
  process.env.POSTGRES_DATABASE_URL
);

if (!process.env.DATABASE_URL) {
  console.error(`
Missing DATABASE_URL (reference likely failed to resolve).

Related env keys visible to the container:
  ${relatedKeys.length ? relatedKeys.join(", ") : "(none)"}

Fix in Railway (most reliable):
  1. Click the Postgres service on the canvas
  2. Variables → copy the value of DATABASE_URL (the real postgres://... string)
  3. Click the web service → Variables
  4. Edit DATABASE_URL and paste that postgres:// string directly
  5. Deploy → Redeploy

Or keep a reference, but the service name must match the canvas exactly:
  DATABASE_URL=\${{ Postgres.DATABASE_URL }}
  (spaces after {{ and before }}, and "Postgres" must match the DB service name)
`);
  process.exit(1);
}

console.log(
  `DATABASE_URL loaded (${process.env.DATABASE_URL.length} chars; keys: ${relatedKeys.join(", ") || "DATABASE_URL"})`
);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npm", ["run", "start"]);
