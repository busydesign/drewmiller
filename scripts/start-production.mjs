import { spawnSync } from "node:child_process";

const port = process.env.PORT || "3000";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

console.log(`Starting Next.js on 0.0.0.0:${port}`);

const result = spawnSync(
  "npx",
  ["next", "start", "--hostname", "0.0.0.0", "--port", String(port)],
  { stdio: "inherit", env: process.env }
);

process.exit(result.status ?? 1);
