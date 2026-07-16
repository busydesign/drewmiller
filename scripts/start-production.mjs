import { spawnSync } from "node:child_process";
import net from "node:net";
import { URL } from "node:url";

const port = process.env.PORT || "3000";

function log(...args) {
  console.log(...args);
}

function run(command, args, opts = {}) {
  log(">", command, args.join(" "));
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    timeout: opts.timeout,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

function dbHostInfo(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "5432"}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function canReachDb(databaseUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      resolve(false);
      return;
    }
    const socket = net.connect({
      host: parsed.hostname,
      port: Number(parsed.port || 5432),
      timeout: timeoutMs,
    });
    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function main() {
  log("Railway start");
  log("PORT=", process.env.PORT ?? "(unset)", "→ using", port);
  log("RAILWAY_PUBLIC_DOMAIN=", process.env.RAILWAY_PUBLIC_DOMAIN ?? "(unset)");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  log("DATABASE_URL host=", dbHostInfo(databaseUrl));

  if (process.env.SKIP_MIGRATIONS === "1") {
    log("SKIP_MIGRATIONS=1 — skipping prisma migrate");
  } else {
    log("Checking database TCP connectivity...");
    const reachable = await canReachDb(databaseUrl);
    if (!reachable) {
      console.error(
        "Cannot reach Postgres host within 8s. Check DATABASE_URL (prefer the Postgres service's DATABASE_URL / private URL)."
      );
      process.exit(1);
    }
    log("Database host reachable — running migrations");
    run("npx", ["prisma", "migrate", "deploy"], { timeout: 120_000 });
    log("Migrations complete");
  }

  log(`Starting Next.js on 0.0.0.0:${port}`);
  run("npx", ["next", "start", "--hostname", "0.0.0.0", "--port", String(port)]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
