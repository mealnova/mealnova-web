const seenIssues = new Set<string>();

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function logCmsRuntimeIssue(scope: string, error: unknown) {
  const message = normalizeErrorMessage(error);
  const key = `${scope}:${message}`;

  if (seenIssues.has(key)) {
    return;
  }

  seenIssues.add(key);
  console.error(`[cms-runtime] ${scope}: ${message}`);
}

export async function safeCmsLoad<T>(
  scope: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    logCmsRuntimeIssue(scope, error);
    return fallback;
  }
}
