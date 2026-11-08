import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

type LogFields = Record<string, unknown>;

const logPath = join(process.cwd(), "data", "bearly-secure.log");
const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_LOG_FIELDS = new Set([
  "sessionId",
  "resetToken",
  "resetLink",
  "secret",
  "adminNotes",
  "storagePath",
]);

function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      SENSITIVE_LOG_FIELDS.has(key) ? REDACTED_VALUE : value,
    ]),
  );
}

export function logEvent(eventName: string, fields: LogFields = {}): void {
  mkdirSync(dirname(logPath), { recursive: true });

  appendFileSync(
    logPath,
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      event: eventName,
      ...redact(fields),
    })}\n`,
  );
}