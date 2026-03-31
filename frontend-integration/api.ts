// src/lib/api.ts
// Drop this file into your connect-marketing frontend (src/lib/api.ts)

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function submitContact(data: ContactPayload) {
  return request<{ success: boolean; message: string; data: { id: number } }>(
    "/contact",
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ─── Lead Capture (Popup) ────────────────────────────────────────────────────

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  interestedService?: string;
  source: "contact_form" | "popup" | "chatbot" | "whatsapp" | "other";
}

export async function captureLead(data: LeadPayload) {
  return request<{ success: boolean; message: string; data: { id: number } }>(
    "/leads",
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ─── Chat Session ─────────────────────────────────────────────────────────────

export async function upsertChatSession(payload: {
  sessionId?: string;
  name?: string;
  email?: string;
  phone?: string;
  interestedService?: string;
}) {
  return request<{ success: boolean; data: { sessionId: string } }>(
    "/chat/session",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function completeChatSession(sessionId: string) {
  return request<{ success: boolean; message: string }>(
    "/chat/complete",
    { method: "POST", body: JSON.stringify({ sessionId }) }
  );
}
