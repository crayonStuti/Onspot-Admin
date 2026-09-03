'use server';

import {
  addAddress,
  addCompany,
  addLike,
  addUser,
  AssignCompany,
  AssignRoles,
  CheckCompanyPermission,
  checkUserLogin,
  CreateItem,
  CreateMultipleVariant,
  CreateSingleVariant,
  deleteAddress,
  deleteFileByName,
  DeleteItems,
  DeleteUser,
  editAddress,
  EditItem,
  fetchAllCompany,
  fetchAllCountry,
  fetchAllCurrency,
  fetchAllItems,
  fetchAllUser,
  fetchAttributesoptionsList,
  fetchCustomFields,
  fetchSystemFields,
  fetchSystemSettings,
  fetchUserFiles,
  forgotPassword,
  getActivityLogs,
  getAddress,
  getAddressByName,
  getAddressCountByCompany,
  getAllAddressCount,
  getAnyLinkData,
  GetAttachments,
  GetCompany,
  GetCompanyProfile,
  getDetails,
  getDrodpdownData,
  getItemAttributesList,
  GetLoginUserDetails,
  getMultipleVariant,
  getSingleVariant,
  getTableFields,
  getTimezone,
  GetTotalItemCount,
  GetTotalUserCount,
  getUserDetails,
  getUserRoles,
  GetUsers,
  postComment,
  RemoveAttachments,
  renameTitle,
  signUp,
  UpdateCompany,
  UpdateCompanyName,
  UpdatePass,
  updateUser,
  updateUserPassword,
  updateUserRoles,
  uploadFileApi,
  userLogin,
  userLogout,
} from './Index';

/**
 * Submit login form for user authentication.
 * @param data - Object containing user credentials (`usr` and `pwd`)
 * @returns API response with login status and user info
 */
export async function submitLoginForm(data: any): Promise<any> {
  const result = await userLogin(data);
  return result;
}

/**
 * Check whether user has permission for a company.
 * @param data - Object containing user and company details
 * @returns API response with permission status
 */
export async function CheckUserCompanyPermission(data: any): Promise<any> {
  const result = await CheckCompanyPermission(data);
  return result;
}

/**
 * Get currently logged-in user details.
 * @param data - Object containing user email id (`usermailid`)
 * @returns API response with logged-in user details
 */
export async function GetLoggedInUser(data: any): Promise<any> {
  const result = await GetLoginUserDetails(data);
  return result;
}

/**
 * Fetch company details for the logged-in user.
 * @returns API response with company information
 */
export async function FetchCompanyDetails(): Promise<any> {
  const result = await GetCompany();
  return result;
}

/**
 * Logout the current user.
 * @returns API response indicating logout success or failure
 */
export async function Logout(): Promise<any> {
  const result = await userLogout();
  return result;
}

/**
 * Register a new user.
 * @param data - Object containing user signup details
 * @returns API response with signup status
 */
export async function UserSignUp(data: any): Promise<any> {
  const result = await signUp(data);
  return result;
}

/**
 * Create a new company.
 * @param data - Object containing company details
 * @returns API response with company creation status
 */
export async function CreateCompany(data: any): Promise<any> {
  const result = await addCompany(data);
  return result;
}

/**
 * Assign a user to a company.
 * @param data - Object containing user and company mapping details
 * @returns API response with assignment status
 */
export async function AssignUserCompany(data: any): Promise<any> {
  const result = await AssignCompany(data);
  return result;
}

/**
 * Assign roles to a user.
 * @param data - Object containing user role details
 * @returns API response with role assignment status
 */
export async function AssignUserRoles(data: any): Promise<any> {
  const result = await AssignRoles(data);
  return result;
}

/**
 * Update user password.
 * @param data - Object containing old and new password details
 * @returns API response with password update status
 */
export async function UpdatePassword(data: any): Promise<any> {
  const result = await UpdatePass(data);
  return result;
}

/**
 * Fetch all users.
 * @param data - Optional filter or pagination details
 * @returns API response with list of users
 */
export async function GetAllUser(data: any): Promise<any> {
  const result = await fetchAllUser(data);
  return result;
}

/**
 * Fetch all companies.
 * @returns API response with list of companies
 */
export async function GetAllCompany(): Promise<any> {
  const result = await fetchAllCompany();
  return result;
}

/**
 * Fetch all available currencies.
 * @returns API response with list of currencies
 */
export async function GetAllCurrency(): Promise<any> {
  const result = await fetchAllCurrency();
  return result;
}

/**
 * Fetch all countries.
 * @returns API response with list of countries
 */
export async function GetAllCountry(): Promise<any> {
  const result = await fetchAllCountry();
  return result;
}

/**
 * Fetch paginated list of users.
 * @param fields - Fields to fetch for users
 * @param limitStart - Starting index for pagination
 * @param limitPageLength - Number of records per page
 * @param orderBy - Sorting order
 * @param searchQuery - Search keyword
 * @param statusFilter - User status filter
 * @param loggedInUserEmail - Logged-in user's email
 * @returns API response with user list
 */
export async function FetchUserList(
  fields: any,
  limitStart: number = 0,
  limitPageLength: number = 10,
  orderBy: string = 'full_name asc',
  searchQuery: string = '',
  statusFilter: any = '',
  loggedInUserEmail?: string,
): Promise<any> {
  return await GetUsers(
    fields,
    limitStart,
    limitPageLength,
    orderBy,
    searchQuery,
    statusFilter,
    loggedInUserEmail,
  );
}

/**
 * Fetch total user count based on filters.
 * @param searchQuery - Search keyword
 * @param statusFilter - User status filter
 * @param loggedInUserEmail - Logged-in user's email
 * @returns API response with total user count
 */
export async function FetchTotalUserCount(
  searchQuery: string = '',
  statusFilter: any = '',
  loggedInUserEmail?: string,
): Promise<any> {
  return await GetTotalUserCount(searchQuery, statusFilter, loggedInUserEmail);
}

/**
 * Delete a user by email.
 * @param email - User email address
 * @returns API response with delete status
 */
export async function DeleteUserApi(email: string): Promise<any> {
  return await DeleteUser(email);
}

/**
 * Fetch system fields for a doctype.
 * @param doctype - Doctype name
 * @returns API response with system fields
 */
export async function GetSystemFields(doctype: string): Promise<any> {
  return await fetchSystemFields(doctype);
}

/**
 * Fetch custom fields for a doctype.
 * @param doctype - Doctype name
 * @returns API response with custom fields
 */
export async function GetCustomFields(doctype: string): Promise<any> {
  return await fetchCustomFields(doctype);
}

/**
 * Submit reset password request.
 * @param data - Object containing reset password details
 * @returns API response with reset status
 */
export async function submitResetPasswordForm(data: any): Promise<any> {
  const result = await forgotPassword(data);
  return result;
}

/**
 * Fetch company profile details.
 * @param data - Company identifier
 * @returns API response with company profile
 */
export async function fetchCompanyProfileDeatils(data: string): Promise<any> {
  const result = await GetCompanyProfile(data);
  return result;
}

/**
 * Fetch paginated list of items.
 * @param fields - Fields to fetch
 * @param limitStart - Pagination start index
 * @param limitPageLength - Page size
 * @param orderBy - Sorting order
 * @param companyName - Company name filter
 * @param searchQuery - Search keyword
 * @param filterArray - Additional filters
 * @returns API response with item list
 */
export async function FetchItemList(
  fields: any,
  limitStart: number = 0,
  limitPageLength: number = 10,
  orderBy: string = 'item_name asc',
  companyName: string = '',
  searchQuery: string = '',
  filterArray: (string | number)[][] = [],
) {
  let filters: any[] = [];
  let orFilters: any[] = [];

  if (companyName && companyName.trim() !== '') {
    filters.push(['Item Default', 'company', '=', companyName]);
  }

  // Add status filters from filterArray
  if (filterArray.length > 0) {
    filters.push(...filterArray);
  }

  // search
  if (searchQuery.trim()) {
    const like = `%${searchQuery}%`;
    orFilters = [
      ['item_name', 'like', like],
      ['name', 'like', like],
    ];
  }

  return await fetchAllItems(
    fields,
    filters,
    orFilters,
    limitStart,
    limitPageLength,
    orderBy,
  );
}

/**
 * Fetch total item count.
 * @param companyName - Company name
 * @param searchQuery - Search keyword
 * @param filterArray - Additional filters
 * @returns API response with item count
 */
export async function FetchTotalItemCount(
  companyName: string = '',
  searchQuery: string = '',
  filterArray: (string | number)[][] = [],
) {
  return await GetTotalItemCount(companyName, searchQuery, filterArray);
}

/**
 * Delete item by item code.
 * @param item_code - Item code
 * @returns API response with delete status
 */
export async function DeleteItemsApi(item_code: string): Promise<any> {
  return await DeleteItems(item_code);
}

/**
 * Fetch merged system and custom fields for a doctype.
 * @param doctype - Doctype name
 * @returns Grouped and merged field structure
 */
export async function GetAllFields(doctype: string): Promise<any> {
  const [systemRes, customRes] = await Promise.all([
    fetchSystemFields(doctype),
    fetchCustomFields(doctype),
  ]);

  const systemFields =
    systemRes?.data?.data?.fields ?? systemRes?.data?.fields ?? [];
  const customFields = customRes?.data?.data ?? customRes?.data ?? [];

  function insertAfterField(
    sections: any[],
    insertAfter: string,
    customField: any,
  ) {
    for (const section of sections) {
      for (let i = 0; i < section.fields.length; i++) {
        const f = section.fields[i];

        // normal field
        if (f.fieldname === insertAfter) {
          section.fields.splice(i + 1, 0, customField);
          return true;
        }

        // collapsible
        if (f.fields) {
          for (let j = 0; j < f.fields.length; j++) {
            if (f.fields[j].fieldname === insertAfter) {
              f.fields.splice(j + 1, 0, customField);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function groupFieldsByTab(fields: any[]) {
    const sections: any[] = [];

    let currentSection: any = null;
    let currentCollapsible: any = null;

    fields.forEach((field: any) => {
      // skip column break
      if (field.fieldtype === 'Column Break') return;

      // TAB BREAK
      if (field.fieldtype === 'Tab Break') {
        currentSection = {
          id: field.fieldname,
          label: field.label,
          ...field,
          fields: [],
        };
        sections.push(currentSection);
        currentCollapsible = null;
        return;
      }

      // ignore first Section Break (collapsible=0)
      if (
        field.fieldtype === 'Section Break' &&
        field.collapsible === 0 &&
        currentSection &&
        currentSection.fields.length === 0
      ) {
        return;
      }

      // SECTION BREAK - collapsible
      if (field.fieldtype === 'Section Break' && field.collapsible === 1) {
        currentCollapsible = {
          ...field,
          fields: [],
        };
        if (currentSection) {
          currentSection.fields.push(currentCollapsible);
        }
        return;
      }

      // push fields inside collapsible
      if (currentCollapsible) {
        currentCollapsible.fields.push(field);
        return;
      }

      // normal fields inside section
      if (currentSection) {
        currentSection.fields.push(field);
      }
    });
    return sections.filter((s) => s.fields.length > 0);
  }
  const groupedSections = groupFieldsByTab(systemFields);

  customFields.forEach((cf: any) => {
    if (!cf.insert_after) return;

    const inserted = insertAfterField(groupedSections, cf.insert_after, cf);

    if (!inserted && groupedSections.length) {
      groupedSections[0].fields.push(cf);
    }
  });

  let mergedFields = [...systemFields, ...customFields];
  mergedFields.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));

  return {
    groupedSections,
    mergedFields,
  };
}

/**
 * Fetch linked document data.
 * @param data - Link identifier
 * @returns API response with linked data
 */
export async function fetchAnyLinkData(data: string): Promise<any> {
  return await getAnyLinkData(data);
}

/**
 * Fetch user details by email.
 * @param email - User email address
 * @returns API response with user details
 */
export async function fetchUserDetails(email: string): Promise<any> {
  return await getUserDetails(email);
}

/**
 * Update user details.
 * @param email - User email address
 * @param data - Updated user data
 * @returns API response with update status
 */
export async function UpdateUser(email: string, data: any): Promise<any> {
  const result = await updateUser(email, data);
  return result;
}

/**
 * Create a new user.
 * @param data - User creation payload
 * @returns API response with creation status
 */
export async function CreateUser(data: any): Promise<any> {
  const result = await addUser(data);
  return result;
}

/**
 * Update company profile details.
 * @param docId - Company document ID
 * @param data - Updated company data
 * @returns API response with update status
 */
export async function UpdateCompanyProfile(docId: string, data: any) {
  return await UpdateCompany(docId, data);
}

/**
 * Upload document image for a record.
 * @param file - Image file
 * @param doctype - Document type
 * @param docname - Document name
 * @returns API response with upload status
 */
export async function UploadDocImage(
  file: File,
  doctype: string,
  docname: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doctype', doctype);
  formData.append('docname', docname);
  formData.append('is_private', '0');

  const res = await uploadFileApi(formData);
  return res;
}

/**
 * Delete image by file name.
 * @param fileName - Image file name
 * @returns API response with delete status
 */
export async function DeleteImageByName(fileName: string): Promise<any> {
  return await deleteFileByName(fileName);
}

/**
 * Fetch uploaded image names for a user or document.
 * @param name - User or document name
 * @returns API response with image list
 */
export async function FetchImageName(name: string): Promise<any> {
  const result = await fetchUserFiles(name);
  return result;
}

/**
 * Change company name.
 * @param data - Company name update payload
 * @returns API response with update status
 */
export async function changeCompanyName(data: any): Promise<any> {
  return await UpdateCompanyName(data);
}

/**
 * Fetch attachments for a document.
 * @param attached_to_name - Document name
 * @param attached_to_doctype - Document doctype
 * @returns API response with attachment list
 */
export async function FetchAttachments(
  attached_to_name: any,
  attached_to_doctype: any,
): Promise<any> {
  return await GetAttachments(attached_to_name, attached_to_doctype);
}

/**
 * Delete attachment by attachment name.
 * @param attachment_name - Attachment name
 * @returns API response with delete status
 */
export async function deleteAttachment(attachment_name: any): Promise<any> {
  return await RemoveAttachments(attachment_name);
}

/**
 * Update user roles.
 * @param email - User email
 * @param roles - Array of roles
 * @returns API response with update status
 */
export async function UpdateUserRoles(
  email: string,
  roles: string[],
): Promise<any> {
  return await updateUserRoles(email, roles);
}

/**
 * Get user roles after successful login.
 * @param email - User email
 * @returns API response with roles
 */
export async function GetUserRoles(email: string): Promise<any> {
  return await getUserRoles(email);
}

/**
 * Fetch company details for logged-in user.
 * @returns API response with company details
 */
export async function GetLoggedInUserCompany(): Promise<any> {
  const result = await GetCompany();
  return result;
}

/**
 * Assign user to a company.
 * @param data - User-company assignment data
 * @returns API response with assignment status
 */
export async function AssignUserToCompany(data: any): Promise<any> {
  const result = await AssignCompany(data);
  return result;
}

/**
 * Fetch timezone list.
 * @returns Array of timezones
 */
export async function FetchTimezoneList(): Promise<any> {
  const result = await getTimezone();
  return result.data || [];
}

/**
 * Fetch logged-in user's email using cookies/session.
 * @returns API response with user email
 */
export async function fetchUserEmail(): Promise<any> {
  const result = await checkUserLogin();
  return result;
}

/**
 * Fetch system settings used across the application.
 * @returns API response with system settings
 */
export async function getSystemSettings(): Promise<any> {
  const result = await fetchSystemSettings();
  return result;
}

/**
 * Fetch user activity logs.
 * @param name - User email or item code
 * @returns API response with activity logs
 */
export async function FetchActivityLog(doctype: any,name: any): Promise<any> {
  const result = await getActivityLogs(doctype,name);
  return result;
}

/**
 * Update user password.
 * @param data - Password update payload
 * @returns API response with update status
 */
export async function UpdateUserPassword(data: any): Promise<any> {
  const result = await updateUserPassword(data);
  return result;
}

/**
 * Fetch addresses linked to a document.
 * @param link_doctype - Linked doctype
 * @param link_name - Linked document name
 * @param limit_page_length - Page size
 * @param limit_start - Pagination start
 * @returns API response with address list
 */
export async function fetchAddress(
  link_doctype: any,
  link_name: any,
  limit_page_length: any,
  limit_start: any,
): Promise<any> {
  const result = await getAddress(
    link_doctype,
    link_name,
    limit_page_length,
    limit_start,
  );
  return result;
}

/**
 * Fetch address count by company.
 * @param data - Company filter data
 * @returns API response with address count
 */
export async function fetchAddressCountByCompany(data: any): Promise<any> {
  const result = await getAddressCountByCompany(data);
  return result;
}

/**
 * Fetch total address count.
 * @param link_doctype - Linked doctype
 * @param link_name - Linked name
 * @returns API response with count
 */
export async function fetchAddressCount(
  link_doctype: any,
  link_name: any,
): Promise<any> {
  const result = await getAllAddressCount(link_doctype, link_name);
  return result;
}

/**
 * Fetch address details by name.
 * @param address_name - Address name
 * @returns API response with address details
 */
export async function fetchAddressByName(address_name: any): Promise<any> {
  const result = await getAddressByName(address_name);
  return result;
}

/**
 * Delete address by name.
 * @param address_name - Address name
 * @returns API response with delete status
 */
export async function deleteAddressbyName(address_name: any): Promise<any> {
  const result = await deleteAddress(address_name);
  return result;
}

/**
 * Create a new address.
 * @param data - Address creation payload
 * @returns API response with creation status
 */
export async function CreateAddress(data: any): Promise<any> {
  const result = await addAddress(data);
  return result;
}

/**
 * Update address details.
 * @param address_name - Address name
 * @param data - Updated address data
 * @returns API response with update status
 */
export async function UpateAddress(address_name: any, data: any): Promise<any> {
  const result = await editAddress(address_name, data);
  return result;
}

/**
 * Create a new item.
 * @param data - Item creation payload
 * @returns API response with creation status
 */
export async function addItem(data: any): Promise<any> {
  const result = await CreateItem(data);
  return result;
}

/**
 * Update item details.
 * @param item_code - Item code
 * @param data - Updated item data
 * @returns API response with update status
 */
export async function UpdateItem(item_code: any, data: any): Promise<any> {
  const result = await EditItem(item_code, data);
  return result;
}

/**
 * Fetch single item variant.
 * @param data - Variant query data
 * @returns API response with variant details
 */
export async function FetchSingleVariant(data: any): Promise<any> {
  const result = await getSingleVariant(data);
  return result;
}

/**
 * Add single item variant.
 * @param data - Variant creation payload
 * @returns API response with creation status
 */
export async function AddSingleVariant(data: any): Promise<any> {
  const result = await CreateSingleVariant(data);
  return result;
}

/**
 * Fetch multiple item variants.
 * @param data - Variant query data
 * @returns API response with variants list
 */
export async function FetchMultipleVariant(data: any): Promise<any> {
  const result = await getMultipleVariant(data);
  return result;
}

/**
 * Add multiple item variants.
 * @param data - Variant creation payload
 * @returns API response with creation status
 */
export async function AddMultipleVariant(data: any): Promise<any> {
  const result = await CreateMultipleVariant(data);
  return result;
}

/**
 * Fetch table fields for a doctype.
 * @param doctype - Doctype name
 * @returns API response with table fields
 */
export async function FetchTableFields(doctype: any): Promise<any> {
  const result = await getTableFields(doctype);
  return result;
}

/**
 * Fetch item attributes list.
 * @param companyName - Company name
 * @returns API response with attributes list
 */
export async function FetchItemAttributesList(companyName: any): Promise<any> {
  const result = await getItemAttributesList(companyName);
  return result;
}

/**
 * Fetch attribute options list.
 * @param attributeId - Attribute ID
 * @returns API response with options list
 */
export async function GetAttributesoptionsList(attributeId: any): Promise<any> {
  const result = await fetchAttributesoptionsList(attributeId);
  return result;
}

/**
 * Fetch dropdown data.
 * @param data - Dropdown query payload
 * @returns API response with dropdown data
 */
export async function FetchDrodpdownData(data: any): Promise<any> {
  const result = await getDrodpdownData(data);
  return result;
}

/**
 * Fetch document details.
 * @param doctype - Document type
 * @param name - Document name
 * @returns API response with document details
 */
export async function Fetchdetails(doctype: any, name: any): Promise<any> {
  const result = await getDetails(doctype, name);
  return result;
}

/**
 * To rename in item.
 * @data doctype - payload
 * @returns API response after rename
 */

export async function RenameTitle(data: any): Promise<any> {
  const result = await renameTitle(data);
  return result;
}

/**
 * Add like to item or User.
 * @param data - Payload (doctype, name, add["Yes" or "No"])
 * @returns API response
 */
export async function postLike(data: any): Promise<any> {
  const result = await addLike(data);
  return result;
}


export async function PostComment(data: any): Promise<any> {
  const result = await postComment(data);
  return result;
}
