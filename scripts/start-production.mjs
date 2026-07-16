import { spawnSync } from "node:child_process";

const port = process.env.PORT || "3000";

console.log("Railway start");
console.log("PORT=", process.env.PORT ?? "(unset)");
console.log("Using port", port);
console.log(
  "RAILWAY_PUBLIC_DOMAIN=",
  process.env.RAILWAY_PUBLIC_DOMAIN ?? "(unset)"
);
console.log("DATABASE_URL set=", Boolean(process.env.DATABASE_URL?.trim()));

if (!process.env.DATABASE_URL?.trim()) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

function run(command, args) {
  console.log(">", command, args.join(" "));
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
console.log("Migrations complete — starting Next.js");
run("npx", ["next", "start", "--hostname", "0.0.0.0", "--port", String(port)]);
