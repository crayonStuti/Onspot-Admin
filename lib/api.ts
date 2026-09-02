export const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://onspot-api-frontend-61nmav-f95e2f-194-163-134-149.traefik.me";

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

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function setAuthSession(token: string, user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `auth-token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
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
      window.dispatchEvent(new CustomEvent("onSpot:unauthorized"));
    }

    throw new ApiError(message, response.status, errorName, errorBody);
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

export async function getStates(page: number = 1, limit: number = 100): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await fetchApi(`/states?${params.toString()}`);
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

