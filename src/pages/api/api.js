// src/pages/api/api.js

/* ---------------------------
   Auth storage (browser-safe)
---------------------------- */
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
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/* ---------------------------
   API base + URL utilities
---------------------------- */
function getApiBase() {
  // Prefer BASE, then URL; fallback to same-origin /api (works with CloudFront behavior)
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "/api";
  return String(base).replace(/\/+$/, ""); // trim trailing slashes
}

function joinUrl(base, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  // collapse accidental multiple slashes (but not after http(s):)
  return `${base}${p}`.replace(/(?<!:)\/{2,}/g, "/");
}

/* ---------------------------
   Core fetch wrapper
---------------------------- */
export async function apiFetch(pathOrUrl, options = {}) {
  const base = getApiBase();
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : joinUrl(base, pathOrUrl);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Auto-attach Authorization unless explicitly disabled
  const wantAuth = options.auth !== false;
  const token = wantAuth ? getToken() : null;
  if (wantAuth && token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
    credentials: options.credentials || "include",
    signal: options.signal,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    if (res.status === 401) clearAuth();
    const msg = (data && (data.error || data.message)) || `API error: ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data ?? {};
}

/* ---------------------------
   Auth endpoints (Dynamo)
---------------------------- */
export async function signup({ name, email, password }) {
  const data = await apiFetch("/signup", {
    method: "POST",
    body: { name, email, password },
    auth: false,
  });
  if (data?.accessToken) setAuth(data.accessToken, data.user);
  return data;
}

export async function login({ email, password }) {
  const data = await apiFetch("/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  if (data?.accessToken) setAuth(data.accessToken, data.user);
  return data;
}

export function logout() {
  clearAuth();
}

/* ---------------------------
   Files: stats, list
   NOTE: base is /api, so paths below DO NOT start with /api
---------------------------- */
export async function fetchFileStats(scope = "me") {
  return apiFetch(`/files/stats?scope=${encodeURIComponent(scope)}`, {
    auth: scope !== "all",
  });
}

export async function fetchFileList() {
  return apiFetch("/files/list");
}

/* ---------------------------
   Presign helpers (S3)
---------------------------- */
export async function presignUpload({ fileName, contentType }) {
  return apiFetch("/files/presign/upload", {
    method: "POST",
    body: { fileName, contentType },
  });
}

export async function presignView({ key }) {
  return apiFetch(`/files/presign/view?key=${encodeURIComponent(key)}`);
}

export async function presignDownload({ key }) {
  return apiFetch(`/files/presign/download?key=${encodeURIComponent(key)}`);
}

/* ---------------------------
   High-level upload helper
---------------------------- */
export async function uploadFileToS3(file) {
  const { name, type } = file;
  const { uploadUrl, key } = await presignUpload({
    fileName: name,
    contentType: type || "application/octet-stream",
  });

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`S3 upload failed: ${putRes.status} ${putRes.statusText}`);
  }

  return { key };
}

/* ---------------------------
   Health check (optional)
---------------------------- */
export async function health() {
  return apiFetch("/health", { auth: false });
}
