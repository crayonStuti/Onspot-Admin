import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { signout } from './actions';

export const logout = async () => {
  try {
    await signOut(auth);
    // Remove auth cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    const token = localStorage.getItem('authToken');
    const reqBody = {
      action:'LOGOUT'
    }
    await signout(token, reqBody);
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');

    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};