export type ContentTemplateContext = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function lookup(context: ContentTemplateContext, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!isRecord(value)) return undefined;
    return value[key];
  }, context);
}

export function resolveTemplateString(value: string, context: ContentTemplateContext): string {
  return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawKey: string) => {
    const resolved = lookup(context, rawKey.trim());
    if (resolved === undefined || resolved === null) return "";
    return String(resolved);
  });
}

export function resolveTemplateValue<T>(input: T, context: ContentTemplateContext): T {
  if (typeof input === "string") {
    return resolveTemplateString(input, context) as T;
  }

  if (Array.isArray(input)) {
    return input.map((value) => resolveTemplateValue(value, context)) as T;
  }

  if (isRecord(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolveTemplateValue(value, context),
      ]),
    ) as T;
  }

  return input;
}
