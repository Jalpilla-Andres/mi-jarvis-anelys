export function log(message: string, level: "info" | "warn" | "error" = "info") {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

export function logError(message: string, error?: unknown) {
  log(message, "error");
  if (error instanceof Error) {
    log(`  ${error.message}`, "error");
    log(`  ${error.stack}`, "error");
  } else if (error) {
    log(`  ${JSON.stringify(error)}`, "error");
  }
}
