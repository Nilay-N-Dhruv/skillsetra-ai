import { api } from "@/lib/api";

/** Best-effort analytics tracking; never send sensitive content. */
export async function trackActivity(category, title, description = "") {
  try {
    return await api("/analytics/events", {
      method: "POST",
      body: {
        category,
        title: String(title || "Activity").slice(0, 120),
        description: String(description || "").slice(0, 240),
      },
    });
  } catch {
    // Analytics must not break the feature if tracking is unavailable.
    return null;
  }
}
