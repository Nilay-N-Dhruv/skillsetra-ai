import { api } from "./api";

const MODEL = process.env.NEXT_PUBLIC_PUTER_MODEL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function textOf(r) {                                   // Puter can return a string or a message object
  if (typeof r === "string") return r;
  const c = r?.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p) => p?.text || "").join("");
  return r?.text || String(r ?? "");
}

export function puterLoaded() { return typeof window !== "undefined" && !!window.puter?.ai?.chat; }

export async function runPuter(system, prompt) {
  if (typeof window === "undefined") throw new Error("Puter AI requires a browser.");
  const deadline = Date.now() + 15000;
  while (!puterLoaded() && Date.now() < deadline) await sleep(200);          // wait for the script
  if (!puterLoaded()) throw new Error("Puter AI did not finish loading. Check your connection and ad blocker.");
  const messages = [{ role: "system", content: system }, { role: "user", content: prompt }];
  const opts = { temperature: 0.35, ...(MODEL ? { model: MODEL } : {}) };
  const timeout = sleep(90000).then(() => { throw new Error("Puter AI took too long."); });
  return textOf(await Promise.race([window.puter.ai.chat(messages, opts), timeout]));
}

/** Calls an endpoint that may need AI: ask, run Puter in the browser, relay the answer, repeat. */
export async function callAI(path, opts = {}) {
  let ticket = null;
  for (let round = 0; round < 3; round++) {
    const res = await api(path, { ...opts, headers: ticket ? { "X-AI-Ticket": ticket } : {} });
    if (!res?.needs_ai) return res;                  // a normal answer: done
    let output = null, failed = false;
    try { output = await runPuter(res.system, res.prompt); } catch { failed = true; }
    await api("/ai/relay", { method: "POST", body: failed ? { ticket: res.ticket, failed: true } : { ticket: res.ticket, output } });
    ticket = res.ticket;
  }
  throw new Error("The AI did not return a usable answer. Please try again.");
}