export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startListingSyncScheduler } = await import(
    "./lib/listing-sync-scheduler"
  );
  startListingSyncScheduler();
}
