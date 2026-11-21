/**
 * PixelProTech chat proxy — Cloudflare Worker
 * Keeps the OpenRouter key secret and streams replies back to the site.
 *
 * Secrets / vars (set in Cloudflare, never in the website):
 *   OPENROUTER_API_KEY  (secret)
 *   ALLOWED_ORIGINS     comma list, e.g. https://pixelprotechsolutions.co.za,https://www.pixelprotechsolutions.co.za
 *   MODEL               optional, default below
 */

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const MAX_MESSAGES = 8;
const MAX_CHARS = 600;

const SYSTEM_PROMPT = `You are the website assistant for PixelProTech Solutions (Pty) Ltd, a registered South African field IT engineering company in Gauteng (Johannesburg, Pretoria, Midrand, Centurion, Sandton).

Facts you may state:
- Mobile field engineering: technicians travel to homes, schools and businesses. No fixed workshop.
- Every job starts with structured on-site diagnostics; no work or parts are charged without client approval.
- On-Site Diagnostic: R350 per visit (home users). Business Call-Out: R650 per visit (offices, shops). School Support: custom quote. Replacement parts are quoted separately.
- Services: business IT support, computer and laptop repair, networking and Wi-Fi, data backup and recovery, software and security, printer and peripheral support, hardware supply and installation (quoted per job from supplier prices).
- International software/technology services: enquiry only; nothing is listed as available until approved in writing.
- Contact: WhatsApp / phone 065 197 1461, email pixelprotechsolutions@proton.me.
- The site has a Diagnose + Quote tool, a hardware quotation form and a support section.

Rules:
- Reply in the user's language, briefly (2-5 sentences). Plain text, no markdown.
- Never invent prices, availability, turnaround times, guarantees or certifications. If unsure, say so and send them to WhatsApp 065 197 1461.
- Estimates are not final; final price is confirmed after on-site diagnosis.
- Do not ask for passwords or sensitive personal data.
- For repair bookings or exact quotes, point to the Diagnose + Quote tool or WhatsApp.
- Stay on topic (IT support, repairs, the company). Politely decline anything else.`;

function cors(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    ok,
    headers: {
      "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  };
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") || "";
    const c = cors(origin, allowed);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: c.headers });
    if (request.method !== "POST" || !c.ok)
      return new Response("Forbidden", { status: 403, headers: c.headers });

    let body;
    try { body = await request.json(); } catch { return new Response("Bad request", { status: 400, headers: c.headers }); }

    const msgs = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
    const clean = msgs
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!clean.length || clean[clean.length - 1].role !== "user")
      return new Response("Bad request", { status: 400, headers: c.headers });

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "PixelProTech Website Chat",
      },
      body: JSON.stringify({
        model: env.MODEL || DEFAULT_MODEL,
        stream: true,
        max_tokens: 350,
        temperature: 0.3,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
      }),
    });

    if (!upstream.ok || !upstream.body)
      return new Response("Upstream error", { status: 502, headers: c.headers });

    // Pass the SSE stream straight through for instant first-token display.
    return new Response(upstream.body, {
      status: 200,
      headers: { ...c.headers, "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  },
};
