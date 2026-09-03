import { handleApiError } from './errorHandler';

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchApi(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      const errorText = await response.text();
      errorData = { message: errorText };
    }
    const error = new Error(errorData.message || `Login failed: ${response.status}`);
    (error as any).statusCode = errorData.statusCode || response.status;
    (error as any).error = errorData.error;

    // Global unauthorized handling
    handleApiError(error);

    throw error;
  }

  return await response.json();
}

// Auth
export async function loginUser(body: any) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      const errorText = await response.text();
      errorData = { message: errorText };
    }
    const error = new Error(errorData.message || `API Error: ${response.status}`);
    (error as any).statusCode = errorData.statusCode || response.status;
    (error as any).error = errorData.error;

    // Global unauthorized handling
    handleApiError(error);

    throw error;
  }

  return await response.json();
}

// Users
export async function getUsers(token: string, page: number, limit: number, search = '', status = '', sortBy = 'first_name', sortOrder = 'ASC') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  return await fetchApi(`/auth/users?${params}`, token);
}

export async function getUserById(token: string, userId: string) {
  return await fetchApi(`/user-profile/${userId}`, token);
}

export async function deleteUser(token: string, userId: string) {
  return await fetchApi(`/auth/users/${userId}`, token, { method: 'DELETE' });
}

export async function registerUser(token: string, userData: any) {
  return await fetchApi('/auth/register', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
}

export async function updateUserProfile(token: string, userId: string, data: any) {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/user-profile/${userId}`, token, {
    method: 'PUT',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function getUserLicenses(token: string, userId: string) {
  return await fetchApi(`/licenses`, token);
}

export async function getUserResources(token: string, userId: string) {
  return await fetchApi(`/users/${userId}/resources`, token);
}

// Memberships
export async function getMemberships(token: string, page: number, limit: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await fetchApi(`/memberships?${params}`, token);
}

export async function getMembershipById(token: string, membershipId: string) {
  return await fetchApi(`/membership/${membershipId}`, token);
}

export async function createMembership(token: string, membershipData: any) {
  const isFormData = membershipData instanceof FormData;
  return await fetchApi('/memberships', token, {
    method: 'POST',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? membershipData : JSON.stringify(membershipData),
  });
}

export async function updateMembership(token: string, membershipId: string, membershipData: any) {
  const isFormData = membershipData instanceof FormData;
  return await fetchApi(`/memberships/${membershipId}`, token, {
    method: 'PUT',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? membershipData : JSON.stringify(membershipData),
  });
}

export async function deleteMembership(token: string, membershipId: string) {
  return await fetchApi(`/membership/${membershipId}`, token, { method: 'DELETE' });
}

// Resources
export async function getResources(token: string) {
  return await fetchApi('/resources', token);
}

export async function getAdminResources(token: string, page: number, limit: number, search = '', state_id = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  if (state_id) params.append('state_id', state_id);
  return await fetchApi(`/resources/admin/all?${params}`, token);
}

export async function getAdminResourceById(token: string, resourceId: string) {
  return await fetchApi(`/resources/admin/${resourceId}`, token);
}

export async function createResource(token: string, data: any) {
  const isFormData = data instanceof FormData;
  return await fetchApi('/resources', token, {
    method: 'POST',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function updateResource(token: string, resourceId: string, data: any) {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/resources/${resourceId}`, token, {
    method: 'PUT',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deleteResource(token: string, resourceId: string) {
  return await fetchApi(`/resource/${resourceId}`, token, { method: 'DELETE' });
}

// Map Pins
export async function getMapPins(token: string, page: number, limit: number, search = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  return await fetchApi(`/map/pins?${params}`, token);
}

export async function getMapPinById(token: string, id: string) {
  return await fetchApi(`/map/pins?id=${id}`, token);
}
export async function getAuthLogs(token: string, page: number, limit: number, email = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (email) params.append('email', email);
  return await fetchApi(`/auth/logs?${params}`, token);
}

export async function getAdminActions(token: string, page: number, limit: number, email = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (email) params.append('email', email);
  return await fetchApi(`/admin/actions?${params}`, token);
}

// Gallery
export async function getGallery(token: string, page: number, limit: number, userId = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (userId) params.append('user_id', userId);
  return await fetchApi(`/gallery?${params}`, token);
}

// States
export async function getStates(token: string, page: number, limit: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return await fetchApi(`/states?${params}`, token);
}

export async function getStateById(token: string, stateId: string) {
  return await fetchApi(`/states/${stateId}`, token);
}

export async function createState(token: string, data: any) {
  const isFormData = data instanceof FormData;
  return await fetchApi('/states', token, {
    method: 'POST',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function updateState(token: string, stateId: string, data: any) {
  const isFormData = data instanceof FormData;
  return await fetchApi(`/states/${stateId}`, token, {
    method: 'PUT',
    ...(!isFormData && { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deleteState(token: string, stateId: string) {
  return await fetchApi(`/states/${stateId}`, token, { method: 'DELETE' });
}

// License Types
export async function getLicenseTypes(token: string) {
  return await fetchApi('/licenses/types', token);
}

export async function getUserBookmarks(token: string, email: string) {
  return await fetchApi(`/resource-bookmarks/user/me?email=${email}`, token);
}

export async function getUserMapPins(token: string, email: string, limit: number = 10) {
  const params = new URLSearchParams({ email, limit: String(limit) });
  return await fetchApi(`/map/pins?${params}`, token);
}

// License Issuers
export async function getLicenseIssuers(token: string, page: number, limit: number, search = '') {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  return await fetchApi(`/license-issuers?${params}`, token);
}

export async function createLicenseIssuer(token: string, data: any) {
  return await fetchApi('/license-issuers', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateLicenseIssuer(token: string, issuerId: string, data: any) {
  return await fetchApi(`/license-issuers/${issuerId}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteLicenseIssuer(token: string, issuerId: string) {
  return await fetchApi(`/license-issuers/${issuerId}`, token, { method: 'DELETE' });
}

export async function validateToken(token: string) {
  return await fetchApi('/user-profile/me', token);
}

export async function signout(token:any, Data: any){
  return await fetchApi(`/auth/logout`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Data),
  });
}