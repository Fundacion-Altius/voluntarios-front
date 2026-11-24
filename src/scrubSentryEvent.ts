/**
 * Shared Sentry PII scrubber for both server and client.
 * Same patterns as the backend scrubber.
 */

const PII_PATTERNS: RegExp[] = [
  /\b\d{8}[A-Za-z]\b/g, // DNI
  /\b[XxYyZz]\d{7}[A-Za-z]\b/g, // NIE
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, // email
  /\+?[\d\s().-]{8,}\d/g, // phone
];

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-csrf-token",
  "x-api-key",
]);

const SENSITIVE_KEYS = new Set([
  "dni", "nie", "telefono", "phone", "email", "direccion", "address",
  "fecha_nacimiento", "birthdate", "caso", "case", "beneficiario",
  "beneficiary", "member", "voluntario", "volunteer", "nombre", "name",
  "apellidos", "surname",
]);

function scrubString(value: string): string {
  let result = value;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

function scrubRecord(record: Record<string, unknown>, depth: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(lowerKey)) result[key] = "[REDACTED_HEADER]";
    else if (SENSITIVE_KEYS.has(lowerKey)) result[key] = "[REDACTED_FIELD]";
    else result[key] = scrubObject(value, depth + 1);
  }
  return result;
}

function scrubObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return "[MAX_DEPTH]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return scrubString(obj);
  if (typeof obj === "number" || typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) return obj.map((item) => scrubObject(item, depth + 1));
  if (typeof obj === "object") return scrubRecord(obj as Record<string, unknown>, depth);
  return obj;
}

const SENSITIVE_BODY_MARKERS = ["dni", "telefono", "beneficiario", "member", "caso"];

function scrubRequest(req: any): void {
  if (req.headers) {
    for (const headerName of Object.keys(req.headers)) {
      if (SENSITIVE_HEADERS.has(headerName.toLowerCase())) {
        req.headers[headerName] = "[REDACTED]";
      }
    }
  }
  if (req.data && typeof req.data === "string") {
    const lower = req.data.toLowerCase();
    if (SENSITIVE_BODY_MARKERS.some((marker) => lower.includes(marker))) {
      req.data = "[REDACTED_BODY]";
    }
  }
}

function safeUser(user: any): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  if (user.id) safe.id = user.id;
  if (user.username) safe.username = user.username;
  return safe;
}

function scrubBreadcrumb(bc: any): any {
  return {
    ...bc,
    message: bc.message ? scrubString(bc.message) : bc.message,
    data: bc.data ? scrubObject(bc.data) : bc.data,
  };
}

export function scrubSentryEvent(event: any, _hint: any): any {
  try {
    if (event.request) scrubRequest(event.request);
    if (event.user) event.user = safeUser(event.user);

    for (const exc of event.exception?.values ?? []) {
      if (exc.value) exc.value = scrubString(exc.value);
    }

    if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
    if (event.extra) event.extra = scrubObject(event.extra);
    if (event.contexts) event.contexts = scrubObject(event.contexts);

    event.tags = { ...event.tags, pii_scrubbed: "true" };
    return event;
  } catch {
    return null;
  }
}
