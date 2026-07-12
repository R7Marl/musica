import { AuthSession } from "./types";

const LEGACY_SESSION_KEY = "qfit-session";
const STAFF_SESSION_KEY = "qfit-staff-session";
const PUBLIC_SESSION_KEY = "qfit-public-session";
type SessionType = "staff" | "public";

function hasValidAccessToken(accessToken: string) {
  try {
    const payloadPart = accessToken.split(".")[1];

    if (!payloadPart) {
      return false;
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { exp?: number };

    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(
    session.user.type === "staff" ? STAFF_SESSION_KEY : PUBLIC_SESSION_KEY,
    JSON.stringify(session),
  );
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function getStoredSession(type: SessionType) {
  migrateLegacySession();
  const key = type === "staff" ? STAFF_SESSION_KEY : PUBLIC_SESSION_KEY;
  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;

    if (!session.accessToken || !hasValidAccessToken(session.accessToken)) {
      localStorage.removeItem(key);
      return null;
    }

    if (session.user.type !== type) {
      localStorage.removeItem(key);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function migrateLegacySession() {
  const raw = localStorage.getItem(LEGACY_SESSION_KEY);

  if (!raw) {
    return;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    const key =
      session.user.type === "staff" ? STAFF_SESSION_KEY : PUBLIC_SESSION_KEY;
    localStorage.setItem(key, raw);
  } catch {
    // La sesion antigua no se puede recuperar.
  } finally {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

export function getStaffSession() {
  return getStoredSession("staff");
}

export function getPublicSession() {
  return getStoredSession("public");
}

export function clearStaffSession() {
  localStorage.removeItem(STAFF_SESSION_KEY);
}

export function clearPublicSession() {
  localStorage.removeItem(PUBLIC_SESSION_KEY);
}
