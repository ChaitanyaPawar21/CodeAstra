// frontend/src/shared/api/chat.api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export async function sendChat(payload: {
  message: string;
  history: ChatMessage[];
  repoUrl?: string;
  repoName?: string;
  analysis?: unknown;
}): Promise<string> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // If your API uses auth, add: Authorization: `Bearer ${token}`
    body: JSON.stringify({
      ...payload,
      history: payload.history.map(({ role, content }) => ({ role, content })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data.reply as string;
}
