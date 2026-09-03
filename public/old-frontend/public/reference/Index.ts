'use server';

import { cookies } from 'next/headers';

// Type definition for parameters accepted by fetchApi
type FetchApiParams = {
  url: string;
  data?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | any;
  tags?: string[];
  isAuth?: boolean;
  isCookie?: boolean;
  isPassJsonData?: boolean;
};

// Type definition for the standardized API response format
type FetchApiResponse<T = any> = {
  status: number;
  data: T | null;
  type: 'success' | 'error';
  cookie?: string;
  messages?: string | string[] | null;
};

/**
 * Generic API fetch utility
 * - Handles base URL and authentication
 * - Automatically parses JSON responses
 * - Provides standardized success/error response format
 */
export async function fetchApi<T = any>({
  url,
  data,
  method = 'GET',
  tags,
  isAuth = true,
  isCookie = true,
}: FetchApiParams): Promise<FetchApiResponse<T>> {
  const username = process.env.NEXT_PUBLIC_BASE_API_KEY;
  const baseurl = process.env.NEXT_PUBLIC_BASE_API_URL;
  const password = process.env.NEXT_PUBLIC_BASE_API_SECRET;
  const _url = baseurl + url;
  const auth =
    'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const cookieStore = await cookies();
  const cookieHeader = [
    cookieStore.get('system_user')?.value &&
    `system_user=${cookieStore.get('system_user')?.value}`,
    cookieStore.get('full_name')?.value &&
    `full_name=${cookieStore.get('full_name')?.value}`,
    cookieStore.get('sid')?.value && `sid=${cookieStore.get('sid')?.value}`,
    cookieStore.get('user_id')?.value &&
    `user_id=${cookieStore.get('user_id')?.value}`,
    cookieStore.get('user_lang')?.value &&
    `user_lang=${cookieStore.get('user_lang')?.value}`,
  ]
    .filter(Boolean)
    .join('; ');
  const isFormData = data instanceof FormData;

  try {
    const response = await fetch(_url, {
      method,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(isAuth && { Authorization: auth }),
        ...(isCookie && cookieHeader && { cookie: cookieHeader }),
      },
      ...(method !== 'GET' &&
        data && {
        body: isFormData ? data : JSON.stringify(data),
      }),
      ...(tags && { next: { tags } }), // For Next.js caching
      // next: { revalidate: 60 }
    });

    const contentType = response.headers.get('content-type') || '';
    const cookie = response.headers.get('set-cookie') || '';

    // Handle error response
    if (!response.ok) {
      const errorData = await response.json();
      const parsedArray = errorData?._server_messages
        ? JSON.parse(errorData._server_messages)
        : null;
      const messages = parsedArray?.map(
        (str: string) => JSON.parse(str)?.message,
      );

      return {
        status: response.status,
        data: null,
        cookie,
        type: 'error',
        messages:
          errorData?.message ||
          errorData?.error ||
          errorData?.errors ||
          messages ||
          `Fetch failed: ${response.status} ${response.statusText}`,
      };
    }

    // Handle JSON response
    if (contentType.includes('application/json')) {
      const body = await response.json();
      const exc_type = body?.exc_type;
      const parsedArray = body?._server_messages
        ? JSON.parse(body._server_messages)
        : null;
      const messages = parsedArray?.map(
        (str: string) => JSON.parse(str)?.message,
      );
      return {
        status: response.status,
        data: body,
        type: exc_type == null ? 'success' : 'error',
        messages: messages ?? null,
        cookie,
      };
    } else {
      // Handle non-JSON response
      const text = await response.text();
      return {
        status: response.status,
        data: null,
        cookie,
        type: 'error',
        messages: 'Expected JSON but received non-JSON response',
      };
    }
  } catch (e: any) {
    return {
      status: 500,
      data: null,
      type: 'error',
      messages: 'Something went wrong.',
    };
  }
}

/**
 * Logs in a user by calling the login API with username and password.
 * @param data - Object containing `usr` (email) and `pwd` (password)
 * @returns API response with status, user data, messages, and cookie info
 */
export async function userLogin(data: any): Promise<any> {
  const url = `/api/method/login`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: false,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Check whether a user has company-level permissions.
 * @param data - User email or user identifier
 * @returns API response with permission details
 */
export async function CheckCompanyPermission(data: any): Promise<any> {
  const url = `/api/resource/User Permission?filters=[["user","=","${data}"],["allow","=","Company"]]&fields=["*"]`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    data,
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch logged-in user details using session cookies.
 * @param data - User email or user ID
 * @returns API response with user details
 */
export async function GetLoginUserDetails(data: any): Promise<any | undefined> {
  const url = `/api/resource/User/${data}`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response?.status,
    data: response?.data?.data ?? null,
    type: response?.type,
    messages: response?.messages ?? null,
    cookie: response?.cookie ?? null,
  };
}

/**
 * Fetch companies assigned to the logged-in user.
 * @returns API response with company permission details
 */
export async function GetCompany(): Promise<any | undefined> {
  const url =
    '/api/method/frappe.core.doctype.user_permission.user_permission.get_user_permissions';
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response.status,
    data: response.data?.message ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Logs out the currently authenticated user.
 * @returns API response indicating logout success or failure
 */
export async function userLogout(): Promise<any> {
  const url = `/api/method/logout`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: true,
    isAuth: false,
  });
  return {
    status: response.status,
    data: response.data?.message?.Company ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Register a new user account.
 * @param data - User signup payload (email, password, etc.)
 * @returns API response with signup status
 */
export async function signUp(data: any): Promise<any> {
  const url = `/api/method/frappe.core.doctype.user.user.sign_up`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: false,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Create a new company.
 * @param data - Company creation payload
 * @returns API response with company creation status
 */
export async function addCompany(data: any): Promise<any> {
  const url = `/api/resource/Company`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Assign a company permission to a user.
 * @param data - User-company permission payload
 * @returns API response with assignment status
 */
export async function AssignCompany(data: any): Promise<any> {
  const url = `/api/resource/User Permission`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Assign roles to a user.
 * @param data - Object containing user email and roles array
 * @returns API response with role assignment status
 */
export async function AssignRoles(data: {
  email: string;
  roles: any[];
}): Promise<any> {
  const url = `/api/resource/User/${data.email}`;
  const response = await fetchApi({
    url: url,
    method: 'PUT',
    data: { roles: data.roles },
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Update user password.
 * @param data - Password update payload
 * @returns API response with update status
 */
export async function UpdatePass(data: any): Promise<any> {
  const url = `/api/method/frappe.core.doctype.user.user.update_password`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch all users.
 * @param fields - Optional fields to fetch
 * @returns API response with user list
 */
export async function fetchAllUser(fields?: string): Promise<any> {
  let url = `/api/resource/User?limit_page_length=999999999`;
  if (fields) {
    url += `${url.includes('?') ? '&' : '?'}fields=${fields}`;
  } else {
    url += `${url.includes('?') ? '&' : '?'}fields=["*"]`;
  }
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data?.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch all companies.
 * @returns API response with company list
 */
export async function fetchAllCompany(): Promise<any> {
  let url = `/api/resource/Company`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch all currencies.
 * @returns API response with currency list
 */
export async function fetchAllCurrency(): Promise<any> {
  let url = `/api/resource/Currency?limit_page_length=999999999`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch all countries.
 * @returns API response with country list
 */
export async function fetchAllCountry(): Promise<any> {
  let url = `/api/resource/Country?limit_page_length=999999999`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch system fields for a doctype.
 * @param data - Doctype name
 * @returns API response with system fields
 */
export async function fetchSystemFields(data: any): Promise<any> {
  let url = `/api/resource/DocType/${data}`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Send forgot password request.
 * @param data - Reset password payload
 * @returns API response with reset status
 */
export async function forgotPassword(data: any): Promise<any> {
  let url = `/api/method/frappe.core.doctype.user.user.reset_password`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isCookie: false,
    isAuth: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch custom fields for a doctype.
 * @param data - Doctype name
 * @returns API response with custom fields
 */
export async function fetchCustomFields(data: any): Promise<any> {
  let url = `/api/resource/Custom Field?fields=["*"]&filters=[["Custom Field","dt","=","${data}"]]&limit=999999999999999999`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });
  return {
    status: response?.status,
    data: response?.data?.data ?? null,
    type: response?.type,
    messages: response?.messages ?? null,
    cookie: response?.cookie ?? null,
  };
}

/**
 * Fetch company profile details.
 * @param data - Company document name
 * @returns API response with company profile
 */
export async function GetCompanyProfile(data: any): Promise<any | undefined> {
  const url = `/api/resource/Company/${data}`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response.status,
    data: response.data.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch linked document data with cookie fallback to auth.
 * @param data - Resource path
 * @returns API response with linked data
 */
export async function getAnyLinkData(data: any): Promise<any> {
  const url = `/api/resource/${data}?fields=["*"]&limit=999999999999999`;

  // ---- 1st Attempt: Cookie-based fetch ----
  let response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: true,
    isAuth: false,
  });

  // If success, return
  if (response.status !== 403) {
    return {
      status: response.status,
      data: response.data ?? null,
      type: response.type,
      messages: response.messages ?? null,
      cookie: response.cookie ?? null,
    };
  }

  console.warn(' Permission denied, retrying with Auth...');

  // ---- 2nd Attempt: Auth-based fetch ----
  response = await fetchApi({
    url: url,
    method: 'GET',
    isCookie: false,
    isAuth: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch paginated user list with filters.
 * @returns API response with user list
 */
export async function GetUsers(
  fields: any,
  limitStart: number = 0,
  limitPageLength: number = 10,
  orderBy: string = 'full_name asc',
  searchQuery: string = '',
  statusFilter: string = '',
  loggedInUserEmail?: string,
): Promise<any | undefined> {
  let filters: any[] = [];
  let orFilters: any[] = [];

  // Exclude logged-in user
  if (loggedInUserEmail) {
    filters.push(['name', '!=', loggedInUserEmail]);
  }

  // Status filter - only add if 0 or 1
  if (statusFilter !== '' && statusFilter !== 'all') {
    filters.push(['enabled', '=', parseInt(statusFilter)]);
  }

  // Search filters
  if (searchQuery.trim()) {
    const like = `%${searchQuery}%`;
    orFilters = [
      ['full_name', 'like', like],
      ['name', 'like', like],
      ['username', 'like', like],
    ];
  }

  let url = `/api/resource/User?fields=${JSON.stringify(fields)}&limit_start=${limitStart}&limit_page_length=${limitPageLength}`;

  if (filters.length > 0) {
    url += `&filters=${JSON.stringify(filters)}`;
  }

  if (orFilters.length > 0) {
    url += `&or_filters=${JSON.stringify(orFilters)}`;
  }

  if (orderBy) {
    url += `&order_by=${encodeURIComponent(orderBy)}`;
  }

  const response = await fetchApi({
    url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch total user count.
 * @returns API response with total count
 */
export async function GetTotalUserCount(
  searchQuery: string = '',
  statusFilter: string = '',
  loggedInUserEmail?: string,
): Promise<any | undefined> {
  let filters: any[] = [];
  let orFilters: any[] = [];

  // Exclude logged-in user
  if (loggedInUserEmail) {
    filters.push(['name', '!=', loggedInUserEmail]);
  }

  // Status filter
  if (statusFilter !== '') {
    filters.push(['enabled', '=', parseInt(statusFilter)]);
  }

  // Search filters
  if (searchQuery.trim()) {
    const like = `%${searchQuery}%`;
    orFilters = [
      ['full_name', 'like', like],
      ['name', 'like', like],
      ['username', 'like', like],
    ];
  }
  const DoctypeUser = process.env.NEXT_PUBLIC_API_USER_DOCTYPE;

  let url = `/api/method/frappe.desk.reportview.get_count?doctype=${DoctypeUser}`;

  if (filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  if (orFilters.length > 0) {
    url += `&or_filters=${encodeURIComponent(JSON.stringify(orFilters))}`;
  }

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.message ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Delete user by email.
 * @param email - User email
 * @returns API response with delete status
 */
export async function DeleteUser(email: string): Promise<any | undefined> {
  const url = `/api/resource/User/${email}`;

  const response = await fetchApi({
    url: url,
    method: 'DELETE',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.message ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch item list with pagination and filters.
 * @returns API response with item list
 */
export async function fetchAllItems(
  fields: any,
  filters: any[],
  orFilters: any[],
  limitStart: number = 0,
  limitPageLength: number = 10,
  orderBy: string = 'item_name asc',
) {
  const reqFields = encodeURIComponent(JSON.stringify(fields));
  const reqOrFilters = encodeURIComponent(JSON.stringify(orFilters));
  const reqFilters = encodeURIComponent(JSON.stringify(filters));

  const url =
    `/api/resource/Item?fields=${reqFields}` +
    `&filters=${reqFilters}` +
    `&or_filters=${reqOrFilters}` +
    `&limit_start=${limitStart}` +
    `&limit_page_length=${limitPageLength}` +
    `&order_by=${encodeURIComponent(orderBy)}`;

  const response = await fetchApi({
    url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch total item count.
 * @returns API response with item count
 */
export async function GetTotalItemCount(
  companyName: string = '',
  searchQuery: string = '',
  filterArray: (string | number)[][] = [],
): Promise<any | undefined> {
  let filters: any[] = [];
  let orFilters: any[] = [];

  if (companyName && companyName.trim() !== '') {
    filters.push(['Item Default', 'company', '=', companyName]);
  }

  // Add status filters from filterArray
  if (filterArray.length > 0) {
    filters.push(...filterArray);
  }

  // Search filters
  if (searchQuery.trim()) {
    const like = `%${searchQuery}%`;
    orFilters = [
      ['item_name', 'like', like],
      ['name', 'like', like],
    ];
  }

  const DoctypeItem = process.env.NEXT_PUBLIC_API_ITEM_DOCTYPE;
  let url = `/api/method/frappe.desk.reportview.get_count?doctype=${DoctypeItem}`;

  if (filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  if (orFilters.length > 0) {
    url += `&or_filters=${encodeURIComponent(JSON.stringify(orFilters))}`;
  }

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.message ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Delete item by item code.
 * @param item_code - Item code
 * @returns API response with delete status
 */
export async function DeleteItems(item_code: string): Promise<any | undefined> {
  const url = `/api/resource/Item/${item_code}`;

  const response = await fetchApi({
    url: url,
    method: 'DELETE',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.message ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch user details by email.
 * @param email - User email ID
 * @returns API response with user details
 */
export async function getUserDetails(email: string): Promise<any | undefined> {
  const url = `/api/resource/User/${email}?fields=["*"]`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Update user details by email.
 * @param email - User email ID
 * @param data - Updated user data
 * @returns API response with update status
 */
export async function updateUser(email: string, data: any): Promise<any> {
  const url = `/api/resource/User/${email}`;
  const response = await fetchApi({
    url: url,
    method: 'PUT',
    data,
    isCookie: true,
    isAuth: false,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? response?.data?.message ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Add a new user.
 * @param data - New user details
 * @returns API response with created user info
 */
export async function addUser(data: any): Promise<any> {
  const url = `/api/resource/User`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Update company details.
 * @param docId - Company document ID
 * @param data - Updated company data
 * @returns API response with update status
 */
export async function UpdateCompany(docId: string, data: any) {
  const url = `/api/resource/Company/${docId}`;

  const response = await fetchApi({
    url: url,
    method: 'PUT',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Upload a file to the server.
 * @param formData - File form data
 * @returns API response with uploaded file info
 */
export async function uploadFileApi(formData: FormData) {
  const response = await fetchApi({
    url: '/api/method/upload_file',
    method: 'POST',
    data: formData,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Delete a file by file name.
 * @param fileName - Name of the file
 * @returns API response with delete status
 */
export async function deleteFileByName(fileName: string): Promise<any> {
  const url = `/api/resource/File/${fileName}`;
  const response = await fetchApi({
    url: url,
    method: 'DELETE',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch all files attached to a user.
 * @param userEmail - User email ID
 * @returns API response with user files list
 */
export async function fetchUserFiles(userEmail: string): Promise<any> {
  const filters = JSON.stringify([['attached_to_name', '=', userEmail]]);
  const fields = JSON.stringify([
    'name',
    'file_name',
    'file_url',
    'file_type',
    'file_size',
    'attached_to_doctype',
    'attached_to_name',
    'creation',
  ]);
  const url = `/api/resource/File?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}&order_by=creation desc&limit_page_length=200`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data?.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Update company name.
 * @param data - Company rename payload
 * @returns API response with rename status
 */
export async function UpdateCompanyName(data: any) {
  const url = `/api/method/frappe.model.rename_doc.update_document_title`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: true,
    isCookie: false,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Get all attachments for a document.
 * @param attached_to_name - Document name
 * @param attached_to_doctype - Document doctype
 * @returns API response with attachments list
 */
export async function GetAttachments(
  attached_to_name: any,
  attached_to_doctype: any,
) {
  const url = `/api/resource/File?fields=["*"]&filters=[["attached_to_doctype","=","${attached_to_doctype}"],["attached_to_name","=","${attached_to_name}"]]&limit="9999999999999"`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Remove attachment by name.
 * @param attachment_name - Attachment file name
 * @returns API response with delete status
 */
export async function RemoveAttachments(attachment_name: any) {
  const url = `/api/resource/File/${attachment_name}`;

  const response = await fetchApi({
    url: url,
    method: 'DELETE',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Update user roles.
 * @param email - User email ID
 * @param roles - Array of role names
 * @returns API response with update status
 */
export async function updateUserRoles(email: string, roles: string[]) {
  const url = `/api/resource/User/${email}`;

  const response = await fetchApi({
    url,
    method: 'PUT',
    isAuth: true,
    isCookie: false,
    data: {
      roles: roles.map((r) => ({ role: r })),
    },
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
  };
}

/**
 * Fetch available timezones.
 * @returns API response with timezone list
 */
export async function getTimezone() {
  const url = `/api/method/frappe.core.doctype.user.user.get_timezones`;

  const response = await fetchApi({
    url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  const timezones = response?.data?.message?.timezones ?? [];

  return {
    status: response.status,
    data: timezones,
    type: response.type,
    messages: response.messages ?? null,
  };
}

/**
 * Check currently logged-in user.
 * @returns API response with logged-in user info
 */
export async function checkUserLogin(): Promise<any | undefined> {
  const url = '/api/method/frappe.auth.get_logged_user';

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch system settings.
 * @returns API response with system settings data
 */
export async function fetchSystemSettings(): Promise<any | undefined> {
  const DoctypeSystemSettings =
    process.env.NEXT_PUBLIC_API_SYSTEMSETTINGS_DOCTYPE;
  const url = `/api/method/frappe.desk.form.load.getdoc?doctype=${DoctypeSystemSettings}&name=${DoctypeSystemSettings}&_=1765884888218`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: true,
    isCookie: false,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch user activity logs (timeline, comments, versions, etc.) for a specific user or item.
 * @param Name - item_code or user email whose activity logs are required
 * @returns API response with user activity logs and metadata
 */
export async function getActivityLogs(
  Doctype: any,
  Name: any,
): Promise<any | undefined> {
  const url = '/api/method/frappe.desk.form.load.get_docinfo';

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: { doctype: Doctype, name: Name },
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Get roles of a specific user (not the currently logged-in user).
 * @param email - User email ID
 * @returns API response with list of user roles
 */
export async function getUserRoles(email: string) {
  const url = `/api/method/frappe.core.doctype.user.user.get_roles`;

  const response = await fetchApi({
    url,
    method: 'POST',
    isAuth: false,
    isCookie: true,
    data: {
      uid: email,
    },
  });

  return {
    status: response.status,
    data: response?.data,
    type: response.type,
    messages: response.messages ?? null,
  };
}

/**
 * Updates the logged-in user's password.
 * @param data - Object containing current and new password details
 * @returns API response with status, result data, messages, and cookie info
 */
export async function updateUserPassword(data: any): Promise<any | undefined> {
  const url = '/api/method/frappe.core.doctype.user.user.update_password';

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches address records linked to a specific doctype and document.
 * @param link_doctype - Parent doctype (e.g., Company, Customer)
 * @param link_name - Parent document name
 * @param limit_page_length - Number of records per page
 * @param limit_start - Pagination offset
 * @returns API response with address data and metadata
 */
export async function getAddress(
  link_doctype: any,
  link_name: any,
  limit_page_length: any,
  limit_start: any,
): Promise<any | undefined> {
  let url = `/api/resource/Address?fields=["*"]&filters=[["Dynamic Link","link_doctype","=","${link_doctype}"],["Dynamic Link","link_name","=","${link_name}"]]&limit_page_length=${limit_page_length}&limit_start=${limit_start}`;

  if (limit_page_length)
    url +=
      (url.includes('?') ? '&' : '?') +
      `limit_page_length=${limit_page_length}`;
  if (limit_start)
    url += (url.includes('?') ? '&' : '?') + `limit_start=${limit_start}`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches total address count for a company using filters.
 * @param data - Filter object for address count
 * @returns API response containing address count
 */
export async function getAddressCountByCompany(
  data: any,
): Promise<any | undefined> {
  let url = `/api/method/frappe.client.get_count`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches total address count excluding a specific address.
 * @param link_doctype - Parent doctype
 * @param link_name - Address name to exclude
 * @returns API response containing count value
 */
export async function getAllAddressCount(
  link_doctype: any,
  link_name: any,
): Promise<any | undefined> {
  let url = `/api/method/frappe.client.get_count?doctype=${link_doctype}&filters=[["name","!=","${link_name}"]]`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches a single address by address name.
 * @param address_name - Unique address identifier
 * @returns API response with address details
 */
export async function getAddressByName(
  address_name: any,
): Promise<any | undefined> {
  let url = `/api/resource/Address/${address_name}`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Deletes an address by name.
 * @param address_name - Address identifier to delete
 * @returns API response with deletion result
 */
export async function deleteAddress(
  address_name: any,
): Promise<any | undefined> {
  let url = `/api/resource/Address/${address_name}`;

  const response = await fetchApi({
    url: url,
    method: 'DELETE',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Creates a new address record.
 * @param data - Address payload
 * @returns API response with created address data
 */
export async function addAddress(data: any): Promise<any | undefined> {
  let url = `/api/resource/Address`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Updates an existing address.
 * @param address_name - Address identifier
 * @param data - Updated address payload
 * @returns API response with updated address data
 */
export async function editAddress(
  address_name: any,
  data: any,
): Promise<any | undefined> {
  let url = `/api/resource/Address/${address_name}`;

  const response = await fetchApi({
    url: url,
    method: 'PUT',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Creates a new item.
 * @param data - Item creation payload
 * @returns API response with created item data
 */
export async function CreateItem(data: any): Promise<any | undefined> {
  let url = `/api/resource/Item`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Updates an existing item.
 * @param item_code - Item unique code
 * @param data - Updated item payload
 * @returns API response with updated item data
 */
export async function EditItem(
  item_code: any,
  data: any,
): Promise<any | undefined> {
  let url = `/api/resource/Item/${item_code}`;

  const response = await fetchApi({
    url: url,
    method: 'PUT',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches single variant attribute data for an item.
 * @param data - Variant attribute payload
 * @returns API response with variant details
 */
export async function getSingleVariant(data: any): Promise<any | undefined> {
  let url = `/api/method/erpnext.stock.doctype.item.item.get_item_attribute`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Creates a single item variant.
 * @param data - Variant creation payload
 * @returns API response with created variant info
 */
export async function CreateSingleVariant(data: any): Promise<any | undefined> {
  let url = `/api/method/erpnext.controllers.item_variant.create_variant`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches multiple variants based on filters.
 * @param data - Variant filter payload
 * @returns API response with variant list
 */
export async function getMultipleVariant(data: any): Promise<any | undefined> {
  let url = `/api/method/frappe.client.get_list`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Creates multiple item variants asynchronously.
 * @param data - Variant creation payload
 * @returns API response with enqueue status
 */
export async function CreateMultipleVariant(
  data: any,
): Promise<any | undefined> {
  let url = `/api/method/erpnext.controllers.item_variant.enqueue_multiple_variant_creation`;
  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches table fields for a given doctype.
 * @param doctype - Doctype name
 * @returns API response with field metadata
 */
export async function getTableFields(doctype: any): Promise<any | undefined> {
  let url = `/api/method/frappe.desk.form.load.getdoctype?doctype=${doctype}`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches item attributes list for a company.
 * @param companyName - Company name
 * @returns API response with attribute list
 */
export async function getItemAttributesList(
  companyName: any,
): Promise<any | undefined> {
  const fields = JSON.stringify(['name', 'attribute_name']);
  const filters = JSON.stringify([['custom_company', '=', companyName]]);
  let url = `/api/resource/Item Attribute?fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}&limit_page_length=999999999`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetch attribute options list.
 * @param attributeId - Attribute ID
 * @returns API response with options list
 */
export async function fetchAttributesoptionsList(
  attributeId: any,
): Promise<any | undefined> {
  let url = `/api/resource/Item Attribute/${attributeId}`;
  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches dropdown search results.
 * @param data - Search payload
 * @returns API response with dropdown values
 */
export async function getDrodpdownData(data: any): Promise<any | undefined> {
  let url = `/api/method/frappe.desk.search.search_link`;

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Fetches full document details for view pages.
 * @param doctype - Document doctype
 * @param name - Document name
 * @returns API response with document data
 */
export async function getDetails(
  doctype: any,
  name: any,
): Promise<any | undefined> {
  let url = `/api/method/frappe.desk.form.load.getdoc?doctype=${doctype}&name=${name}`;

  const response = await fetchApi({
    url: url,
    method: 'GET',
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * To rename in item.
 * @data doctype - payload
 * @returns API response after rename
 */

export async function renameTitle(data: any): Promise<any | undefined> {
  let url = '/api/method/frappe.model.rename_doc.update_document_title';

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

/**
 * Add like to item or User.
 * @param data - Payload (doctype, name, add["Yes" or "No"])
 * @returns API response
 */

export async function addLike(data: any): Promise<any | undefined> {
  let url = '/api/method/frappe.desk.like.toggle_like';

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });
  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}

export async function postComment(data: any): Promise<any | undefined> {
  let url = '/api/method/frappe.desk.form.utils.add_comment'

  const response = await fetchApi({
    url: url,
    method: 'POST',
    data: data,
    isAuth: false,
    isCookie: true,
  });

  return {
    status: response.status,
    data: response.data ?? null,
    type: response.type,
    messages: response.messages ?? null,
    cookie: response.cookie ?? null,
  };
}
