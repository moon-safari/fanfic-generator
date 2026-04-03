export async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      throw new Error(payload.error);
    }

    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload as T;
}

export async function requestJsonWithTimeout<T>(
  input: string,
  init: RequestInit | undefined,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await requestJson<T>(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(
        timeoutMessage ?? `Request timed out after ${timeoutMs}ms`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}
