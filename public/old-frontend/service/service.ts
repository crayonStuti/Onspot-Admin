export const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface UserData {
  role: string;
  [key: string]: any;
}

export const getAuthToken = async (): Promise<string | undefined> => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || undefined;
  }
  return undefined;
};

export const authService = {
  redirectToDashboard(): void {
    window.location.href = "/crm/dashboard";
  },

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
    window.location.href = "/login";
  }
};
