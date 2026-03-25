// src/app/lib/stream.ts

/**
 * Format a string as an SSE event (server-side).
 * Handles newlines in data by splitting across multiple data: lines.
 */
export function sseEvent(event: string, data: string): string {
  const dataLines = data.split("\n").map((line) => `data: ${line}`).join("\n");
  return `event: ${event}\n${dataLines}\n\n`;
}

export interface SSECallbacks {
  onTitle?: (title: string) => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Reads a Server-Sent Events stream from a fetch Response.
 * Handles chunked reads, partial lines across chunks, and multi-line data fields.
 */
export async function readSSEStream(
  response: Response,
  callbacks: SSECallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("Response body is not readable");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData: string[] = [];

  function dispatchEvent() {
    if (!currentEvent && currentData.length === 0) return;
    const data = currentData.join("\n");
    currentData = [];

    switch (currentEvent) {
      case "title":
        callbacks.onTitle?.(data);
        break;
      case "delta":
        callbacks.onDelta(data);
        break;
      case "done":
        callbacks.onDone();
        break;
      case "error":
        callbacks.onError(data);
        break;
    }
    currentEvent = "";
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line === "") {
          // Empty line = end of event
          dispatchEvent();
        } else if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData.push(line.slice(6));
        }
      }
    }
    // Handle any remaining data in buffer
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData.push(line.slice(6));
        }
      }
    }
    // Dispatch any final event
    dispatchEvent();
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Stream read failed");
  } finally {
    reader.releaseLock();
  }
}
