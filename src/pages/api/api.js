// src/pages/api/api.js

// Save both token and user in localStorage
export function setAuth(token, user) {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("sv_token", token);
    if (user) localStorage.setItem("sv_user", JSON.stringify(user));
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sv_token");
    localStorage.removeItem("sv_user");
  }
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sv_token");
  }
  return null;
}

export function getUser() {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("sv_user");
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

// Generic fetch that prepends API base URL
export async function apiFetch(url, options = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const fullUrl = url.startsWith("http") ? url : `${base}${url}`;

  const res = await fetch(fullUrl, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Try parsing JSON even on errors
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const msg = data?.error || `API error: ${res.status}`;
    throw new Error(msg);
  }

  return data ?? {};
}

/** Fetch file stats from backend/S3
 * scope = 'me' (default) -> per-user stats (requires token)
 * scope = 'all'          -> whole bucket (only if your backend allows it)
 */
export async function fetchFileStats(scope = "me") {
  const token = getToken();
  return apiFetch(`/files/stats?scope=${encodeURIComponent(scope)}`, {
    headers: scope === "me" && token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/** Optional helpers (use if you want elsewhere) */
export async function fetchFileList() {
  const token = getToken();
  return apiFetch("/api/files/list", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
