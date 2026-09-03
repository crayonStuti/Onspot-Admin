export const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export class ApiError extends Error {
  statusCode: number;
  errorName?: string;
  data?: any;

  constructor(message: string, statusCode: number = 500, errorName?: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorName = errorName;
    this.data = data;
  }
}

/**
 * Parses response error body properly:
 * Handles array of messages, string message, nested errors, or raw text.
 */
function parseErrorMessage(errorData: any, status: number): { message: string; errorName?: string } {
  let message = `Request failed with status ${status}`;
  let errorName = undefined;

  if (errorData && typeof errorData === "object") {
    if (errorData.error && typeof errorData.error === "string") {
      errorName = errorData.error;
    }

    if (typeof errorData.message === "string" && errorData.message.trim().length > 0) {
      message = errorData.message;
    } else if (Array.isArray(errorData.message) && errorData.message.length > 0) {
      message = errorData.message.join(". ");
    } else if (errorData.error && typeof errorData.error === "string") {
      message = errorData.error;
    } else if (errorData.msg && typeof errorData.msg === "string") {
      message = errorData.msg;
    }
  } else if (typeof errorData === "string" && errorData.trim().length > 0) {
    message = errorData;
  }

  return { message, errorName };
}

export const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 1 Day (24 Hours)
export const ABSOLUTE_SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  if (!isSessionValid()) return null;
  return localStorage.getItem("authToken");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function setAuthSession(token: string, user: any, refreshToken?: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  localStorage.setItem("authToken", token);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("sessionCreatedAt", String(now));
  localStorage.setItem("lastActiveAt", String(now));

  const maxExpires = new Date(now + ABSOLUTE_SESSION_MAX_MS);
  document.cookie = `auth-token=${token}; path=/; expires=${maxExpires.toUTCString()}; SameSite=Strict`;
  document.cookie = `session-created=${now}; path=/; expires=${maxExpires.toUTCString()}; SameSite=Strict`;
  document.cookie = `last-active=${now}; path=/; expires=${maxExpires.toUTCString()}; SameSite=Strict`;
}

export function touchActivity() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  localStorage.setItem("lastActiveAt", String(now));
  const maxExpires = new Date(now + ABSOLUTE_SESSION_MAX_MS);
  document.cookie = `last-active=${now}; path=/; expires=${maxExpires.toUTCString()}; SameSite=Strict`;
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  const now = Date.now();
  const sessionCreatedAt = Number(localStorage.getItem("sessionCreatedAt") || 0);
  const lastActiveAt = Number(localStorage.getItem("lastActiveAt") || 0);

  // 1. Check 7-day absolute session expiration
  if (sessionCreatedAt > 0 && now - sessionCreatedAt > ABSOLUTE_SESSION_MAX_MS) {
    console.warn("Session expired: 7-day absolute lifetime exceeded.");
    clearAuthSession();
    return false;
  }

  // 2. Check 1-day inactivity timeout
  if (lastActiveAt > 0 && now - lastActiveAt > INACTIVITY_TIMEOUT_MS) {
    console.warn("Session expired: 24-hour inactivity timeout reached.");
    clearAuthSession();
    return false;
  }

  return true;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("sessionCreatedAt");
  localStorage.removeItem("lastActiveAt");
  document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";
  document.cookie = "session-created=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";
  document.cookie = "last-active=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";
}

let refreshPromise: Promise<string> | null = null;

export async function refreshTokenApi(customRefreshToken?: string): Promise<{ idToken: string; refreshToken?: string }> {
  const refreshToken = customRefreshToken || getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    throw new ApiError("No refresh token stored", 401);
  }

  const url = `${API_URL}/auth/refresh-token`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = null;
      }
    }
    const { message, errorName } = parseErrorMessage(errorBody, response.status);
    // If refresh token call fails, force full logout
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onSpot:unauthorized", { detail: { reason: "refresh_failed" } }));
    }
    throw new ApiError(message, response.status, errorName, errorBody);
  }

  const data = await response.json();
  const newIdToken =
    data.idToken ||
    data.token ||
    data.accessToken ||
    data.data?.idToken ||
    data.data?.token ||
    data.data?.accessToken;

  const newRefreshToken =
    data.refreshToken ||
    data.data?.refreshToken ||
    refreshToken;

  if (!newIdToken) {
    clearAuthSession();
    throw new ApiError("Failed to extract refreshed token from response", 500);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", newIdToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }
    touchActivity();
    const sessionCreatedAt = Number(localStorage.getItem("sessionCreatedAt") || Date.now());
    const maxExpires = new Date(sessionCreatedAt + ABSOLUTE_SESSION_MAX_MS);
    document.cookie = `auth-token=${newIdToken}; path=/; expires=${maxExpires.toUTCString()}; SameSite=Strict`;
  }

  return { idToken: newIdToken, refreshToken: newRefreshToken };
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/refresh-token") ||
    endpoint.includes("/auth/register");

  // Validate session timeout on protected calls
  if (!isAuthEndpoint && typeof window !== "undefined" && !isSessionValid()) {
    clearAuthSession();
    window.dispatchEvent(new CustomEvent("onSpot:unauthorized", { detail: { reason: "session_expired" } }));
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set default JSON Content-Type only if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!response.ok) {
    // Check if 401 and we can attempt a token refresh
    const isAuthRefreshEndpoint = endpoint.includes("/auth/refresh-token");
    const storedRefreshToken = getStoredRefreshToken();

    if (response.status === 401 && !isRetry && !isAuthRefreshEndpoint && storedRefreshToken) {
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokenApi()
            .then((res) => res.idToken)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;

        // Retry the failed request with the new token
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };

        return await fetchApi<T>(endpoint, { ...options, headers: retryHeaders }, true);
      } catch (refreshErr) {
        console.warn("Auto token refresh failed:", refreshErr);
        clearAuthSession();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("onSpot:unauthorized", { detail: { reason: "refresh_failed" } }));
        }
      }
    }

    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = null;
      }
    }

    const { message, errorName } = parseErrorMessage(errorBody, response.status);

    if (response.status === 401 && typeof window !== "undefined") {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent("onSpot:unauthorized", { detail: { reason: "unauthorized" } }));
    }

    throw new ApiError(message, response.status, errorName, errorBody);
  }

  // Successful authenticated response: touch activity timestamp
  if (!isAuthEndpoint && typeof window !== "undefined") {
    touchActivity();
  }

  // Handle empty or 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

/* =========================================================================
   AUTH API
   ========================================================================= */

export interface LoginResponse {
  idToken: string;
  refreshToken?: string;
  expiresIn?: string;
  user: {
    id?: string;
    uid?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    photoURL?: string;
    [key: string]: any;
  };
}

export async function loginWithCredentials(body: { email: string; password: string }): Promise<LoginResponse> {
  return await fetchApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function validateToken(): Promise<any> {
  return await fetchApi("/user-profile/me");
}

export async function logoutApi(): Promise<any> {
  try {
    return await fetchApi("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ action: "LOGOUT" }),
    });
  } catch (err) {
    console.warn("Logout API call warning:", err);
  }
}

/* =========================================================================
   USERS API
   ========================================================================= */

export interface UserItem {
  id: string;
  firebase_uid?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  role?: string;
  status?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
  profile?: {
    current_tier?: string;
    profile_picture?: string | null;
    state?: string;
    phone?: string;
    membership?: {
      name?: string;
      price_usd?: string | number;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface UsersResponse {
  data: {
    users: UserItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totaldata: number;
      limit: number;
    };
  };
}

export async function getUsers(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "",
  sortBy: string = "created_at",
  sortOrder: string = "DESC"
): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);

  return await fetchApi<UsersResponse>(`/auth/users?${params.toString()}`);
}

export async function getUserById(userId: string): Promise<any> {
  return await fetchApi(`/user-profile/${userId}`);
}

export async function deleteUser(userId: string): Promise<any> {
  return await fetchApi(`/auth/users/${userId}`, {
    method: "DELETE",
  });
}

export async function registerUser(userData: any): Promise<any> {
  return await fetchApi("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUserProfile(userId: string, data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/user-profile/${userId}`, {
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function getUserLicenses(userId: string): Promise<any> {
  return await fetchApi("/licenses");
}

export async function getUserBookmarks(email: string): Promise<any> {
  return await fetchApi(`/resource-bookmarks/user/me?email=${encodeURIComponent(email)}`);
}

export async function getUserMapPins(email: string, limit: number = 10): Promise<any> {
  const params = new URLSearchParams({ email, limit: String(limit) });
  return await fetchApi(`/map/pins?${params.toString()}`);
}

/* =========================================================================
   MEMBERSHIPS & STATES
   ========================================================================= */

export async function getMemberships(page: number = 1, limit: number = 100): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await fetchApi(`/memberships?${params.toString()}`);
}

export async function getMembershipById(membershipId: string): Promise<any> {
  return await fetchApi(`/membership/${membershipId}`);
}

export async function updateMembership(membershipId: string, data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/memberships/${membershipId}`, {
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deleteMembership(membershipId: string): Promise<any> {
  return await fetchApi(`/membership/${membershipId}`, {
    method: "DELETE",
  });
}

/* =========================================================================
   STATES API
   ========================================================================= */

export interface StateItem {
  state_id: string;
  state_code: string;
  state_name: string;
  state_flag_image?: string;
  state_description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export async function getStates(page: number = 1, limit: number = 100): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await fetchApi(`/states?${params.toString()}`);
}

export async function getStateById(stateId: string): Promise<any> {
  return await fetchApi(`/states/${stateId}`);
}

export async function createState(data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  return await fetchApi("/states", {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function updateState(stateId: string, data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  if (!isFormData && data && typeof data === "object") {
    delete data.state_code;
  }
  return await fetchApi(`/states/${stateId}`, {
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deleteState(stateId: string): Promise<any> {
  return await fetchApi(`/states/${stateId}`, { method: "DELETE" });
}

/* =========================================================================
   LICENSE ISSUERS API
   ========================================================================= */

export interface LicenseIssuerItem {
  id: string;
  organisation: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export async function getLicenseIssuers(
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  return await fetchApi(`/license-issuers?${params.toString()}`);
}

export async function createLicenseIssuer(data: { organisation: string }): Promise<any> {
  return await fetchApi("/license-issuers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLicenseIssuer(issuerId: string, data: { organisation: string }): Promise<any> {
  return await fetchApi(`/license-issuers/${issuerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLicenseIssuer(issuerId: string): Promise<any> {
  return await fetchApi(`/license-issuers/${issuerId}`, { method: "DELETE" });
}

/* =========================================================================
   RESOURCES API
   ========================================================================= */

export interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  resource_type?: string;
  resource_url?: string;
  resource_file?: string | null;
  category?: string;
  category_icon?: string | null;
  content?: string;
  is_published?: boolean | number | string;
  state_id?: string | number;
  state_name?: string;
  state?: any;
  created_at?: string;
  updated_at?: string;
  seasonalData?: any;
  [key: string]: any;
}

export async function getAdminResources(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  state_id: string = ""
): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  if (state_id && state_id !== "all") params.append("state_id", state_id);
  return await fetchApi(`/resources/admin/all?${params.toString()}`);
}

export async function getAdminResourceById(resourceId: string): Promise<any> {
  return await fetchApi(`/resources/admin/${resourceId}`);
}

export async function createResource(data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  return await fetchApi("/resources", {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function updateResource(resourceId: string, data: any): Promise<any> {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/resources/${resourceId}`, {
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deleteResource(resourceId: string): Promise<any> {
  return await fetchApi(`/resource/${resourceId}`, {
    method: "DELETE",
  });
}

export async function getLicenseTypes(): Promise<any> {
  return await fetchApi("/licenses/types");
}

/* =========================================================================
   MAP PINS / GPS ACTIVITY
   ========================================================================= */

export interface MapPinItem {
  id: string;
  latitude: string | number;
  longitude: string | number;
  visibility: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  state?: any;
  state_name?: string;
  tag_type?: any;
  type?: any;
  title?: string;
  location_name?: string;
  loc?: string;
  user?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar?: string;
  };
  tags?: { id: string; name: string }[];
  [key: string]: any;
}

export async function getMapPins(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  state?: string,
  visibility?: string
): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  if (state && state !== "all") params.append("state", state);
  if (visibility && visibility !== "all") params.append("visibility", visibility);
  return await fetchApi(`/map/pins?${params.toString()}`);
}

export async function getMapPinById(id: string): Promise<any> {
  return await fetchApi(`/map/pins?id=${id}`);
}

