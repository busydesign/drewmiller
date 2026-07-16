import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.DATABASE_PRIVATE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRIVATE_URL ||
    "";
}

if (!process.env.DATABASE_URL) {
  console.error(`
Missing DATABASE_URL.

In Railway:
  1. Open your web service (the Next.js app)
  2. Go to Variables
  3. Click "Add Variable" → "Add Reference"
  4. Choose your Postgres service → DATABASE_URL
  5. Redeploy

The site cannot start without a database connection.
`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npm", ["run", "start"]);
