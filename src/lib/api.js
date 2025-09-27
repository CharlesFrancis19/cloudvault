// src/lib/api.js

/* ================================
   Auth storage (browser-safe)
================================= */
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
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  return null;
}

/* ================================
   API base + URL helpers
================================= */
function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "/api";
  return String(base).replace(/\/+$/, "");
}

function joinUrl(base, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`.replace(/(?<!:)\/{2,}/g, "/");
}

/* ================================
   Core fetch wrapper
================================= */
export async function apiFetch(pathOrUrl, options = {}) {
  const base = getApiBase();
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : joinUrl(base, pathOrUrl);

  const headers = { ...(options.headers || {}) };

  const hasJsonBody =
    options.body && typeof options.body === "object" && !(options.body instanceof FormData);
  if (hasJsonBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const wantAuth = options.auth !== false;
  const token = wantAuth ? getToken() : null;
  if (wantAuth && token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;
  if (hasJsonBody) body = JSON.stringify(body);

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
    credentials: options.credentials ?? "include",
    signal: options.signal,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    if (res.status === 401) clearAuth();
    const msg =
      (data && (data.error || data.message)) ||
      `API error: ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.raw = text;
    throw err;
  }

  return data ?? {};
}

/* ================================
   Auth endpoints (Cognito-backed)
================================= */
export async function signup({ name, email, password }) {
  const data = await apiFetch("/signup", {
    method: "POST",
    body: { name, email, password },
    auth: false,
  });
  if (data?.accessToken) setAuth(data.accessToken, data.user);
  return data;
}

export async function resendConfirmation({ email }) {
  return apiFetch("/resend-confirmation", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function confirmSignup({ email, code, password }) {
  return apiFetch("/confirm-signup", {
    method: "POST",
    body: { email, code, password },
    auth: false,
  });
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

export async function loginMfa({ email, code, session, challengeName }) {
  const data = await apiFetch("/login/mfa", {
    method: "POST",
    body: { email, code, session, challengeName },
    auth: false,
  });
  if (data?.accessToken) setAuth(data.accessToken, data.user);
  return data;
}

export async function mfaSetupStart({ session, email }) {
  return apiFetch("/mfa/setup/start", {
    method: "POST",
    body: { session, email },
    auth: false,
  });
}

export async function mfaSetupVerify({ email, code, session }) {
  return apiFetch("/mfa/setup/verify", {
    method: "POST",
    body: { email, code, session },
    auth: false,
  });
}

export function logout() { clearAuth(); }

/* ================================
   Files: list + stats
================================= */
export async function fetchFileList() {
  return apiFetch("/files/list");
}

export async function fetchFileStats(scope = "me") {
  try {
    return await apiFetch(`/files/stats?scope=${encodeURIComponent(scope)}`);
  } catch (e) {
    if (e?.status === 404) {
      const data = await fetchFileList();
      const items = Array.isArray(data?.items) ? data.items : [];
      const totalBytes = items.reduce((acc, it) => acc + (Number(it.size) || 0), 0);
      return {
        count: items.length,
        totalBytes,
        totalMB: +(totalBytes / (1024 * 1024)).toFixed(2),
        scope,
        computed: true,
      };
    }
    throw e;
  }
}

/* ================================
   Crypto helpers (browser)
================================= */
/** Compute SHA-256 hex digest of a File/Blob */
export async function fileSha256Hex(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ================================
   Presigned S3 helpers (+ SQS notify)
================================= */
/**
 * Request a presigned PUT URL.
 * Server REQUIRES sha256 for gating — pass it explicitly.
 */
export async function presignUpload({ fileName, contentType, size, sha256 }) {
  return apiFetch("/files/presign/upload", {
    method: "POST",
    body: { fileName, contentType, size, sha256 },
  });
}

export async function presignView({ key }) {
  return apiFetch(`/files/presign/view?key=${encodeURIComponent(key)}`);
}

export async function presignDownload({ key }) {
  return apiFetch(`/files/presign/download?key=${encodeURIComponent(key)}`);
}

export async function deleteFile({ key }) {
  return apiFetch(`/files/delete?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

/**
 * High-level upload:
 * 1) hash file (sha256)
 * 2) presign with sha256
 * 3) PUT to S3
 * 4) notify backend with sha256
 */
export async function uploadFileToS3(file) {
  const { name, type, size } = file;

  // 1) Compute sha256 (required by server)
  const sha256 = await fileSha256Hex(file);

  // 2) Presign (includes sha256)
  const { uploadUrl, key } = await presignUpload({
    fileName: name,
    contentType: type || "application/octet-stream",
    size: size || 0,
    sha256,
  });

  // 3) Upload to S3
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": type || "application/octet-stream",
      "x-amz-server-side-encryption": "AES256", // must match presign
    },
    body: file,
    credentials: "omit",
  });

  if (!putRes.ok) {
    let bodyText = "";
    try { bodyText = await putRes.text(); } catch {}
    throw new Error(
      `S3 upload failed: ${putRes.status} ${putRes.statusText} ${bodyText || ""}`.trim()
    );
  }

  // 4) Notify (include sha256 for defense-in-depth)
  await apiFetch("/files/notify-upload", {
    method: "POST",
    body: { key, size: size || 0, sha256 },
  });

  return { key, sha256 };
}

/* ================================
   Health check
================================= */
export async function health() {
  return apiFetch("/health", { auth: false });
}
