import { getToken } from "./auth";

const BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const OFFLINE =
  "We couldn't reach the server. Check your connection and try again.";

async function readError(res) {
  let message = "Something went wrong. Please try again.";

  try {
    const data = await res.json();
    if (typeof data?.detail === "string") message = data.detail;
    else if (typeof data?.message === "string") message = data.message;
  } catch {
    // Keep the fallback message.
  }

  if (res.status === 401) {
    message = "Your session has expired. Please sign in again.";
  } else if (res.status === 403) {
    message = "You don't have permission to access this resource.";
  }

  const error = new Error(message);
  error.status = res.status;
  throw error;
}

export async function api(
  path,
  { method = "GET", body, headers = {} } = {}
) {
  const token = await getToken();

  if (!token) {
    const error = new Error("Please sign in to continue.");
    error.status = 401;
    throw error;
  }

  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  if (body !== undefined && body !== null) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let res;

  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: requestHeaders,
      body:
        body !== undefined && body !== null
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw new Error(OFFLINE);
  }

  if (!res.ok) await readError(res);

  if (res.status === 204) return null;

  return res.json();
}

export async function publicGet(path) {
  try {
    const res = await fetch(`${BASE}/api${path}`);

    if (!res.ok) {
      throw new Error();
    }

    return await res.json();
  } catch {
    throw new Error(OFFLINE);
  }
}