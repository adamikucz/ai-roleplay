import type { StreamEvent } from "@aether/shared";
import { API, tokenStore } from "./api";

export async function streamChat(input: {
  sessionId: string;
  characterId: string;
  content: string;
  language?: string;
  modelPreference?: string;
  onEvent: (event: StreamEvent) => void;
}) {
  const token = tokenStore.get();

  if (!token) {
    throw new Error("Missing auth token");
  }

  const res = await fetch(`${API.base}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId: input.sessionId,
      characterId: input.characterId,
      content: input.content,
      language: input.language,
      modelPreference: input.modelPreference
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Stream failed with HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error("Stream response body is empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!line) {
        continue;
      }

      const raw = line.replace(/^data:\s*/, "");

      try {
        const event = JSON.parse(raw) as StreamEvent;
        input.onEvent(event);
      } catch {
        console.warn("Invalid SSE event:", raw);
      }
    }
  }
}