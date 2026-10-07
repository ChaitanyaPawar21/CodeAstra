import { API_URL, UNAUTHORIZED_EVENT } from '../../../shared/api/config';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'google';
  createdAt: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];
  constructor(message: string, status: number, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// The JWT lives in an HttpOnly cookie the browser manages — JS never sees it,
// so there is nothing to store here. `credentials: 'include'` makes fetch send it.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Could not reach the server. Please try again.', 0);
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      json?.message || `Request failed (${response.status})`,
      response.status,
      Array.isArray(json?.errors) ? json.errors : [],
    );
  }
  return json as T;
}

export async function register(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  const json = await request<{ data: { user: AuthUser } }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.data.user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const json = await request<{ data: { user: AuthUser } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.data.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/** Returns the signed-in user, or null when there is no valid session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const json = await request<{ data: { user: AuthUser } }>('/api/auth/me');
    return json.data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
}

/** Google OAuth is a full-page redirect (consent screen), not an XHR. */
export function startGoogleLogin(): void {
  window.location.assign(`${API_URL}/api/auth/google`);
}

export function notifyUnauthorized(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
