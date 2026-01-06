import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  nip: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'staff';
  isWaliKelas: boolean;
  assignedClass: string | null;
  phone: string;
  photo: string | null;
  active: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor() {
    // Check if token is expired on initialization
    const token = this.getToken();
    if (token && this.isTokenExpired()) {
      this.logout();
    }
  }

  private getUserFromStorage(): User | null {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private getTokenExpiry(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tokenExpiry');
    }
    return null;
  }

  private isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return new Date() > new Date(expiry);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !this.isTokenExpired();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isWaliKelas(): boolean {
    const user = this.getCurrentUser();
    return user?.isWaliKelas === true;
  }

  canAccessAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.isWaliKelas === true;
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // IMPORTANT: Password is sent securely in request body (HTTPS encrypts it)
      // It will appear in dev tools but this is normal and unavoidable for authentication
      const response = await fetch(`${this.apiUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });

      if (!response.ok) {
        let errorMessage = 'Login gagal';

        try {
          const errorData = await response.json();
          if (response.status === 401) {
            errorMessage = 'Email atau password salah';
          } else if (response.status === 403) {
            errorMessage = 'Akun tidak memiliki akses';
          } else if (response.status >= 500) {
            errorMessage = 'Server sedang bermasalah, coba lagi nanti';
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          // If JSON parsing fails, use status-based message
          if (response.status === 401) {
            errorMessage = 'Email atau password salah';
          } else if (response.status >= 500) {
            errorMessage = 'Server sedang bermasalah, coba lagi nanti';
          }
        }

        return { success: false, error: errorMessage };
      }

      const data: AuthResponse = await response.json();

      // Store user and token (never store password)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('tokenExpiry', data.expiresAt);
      }

      this.currentUserSubject.next(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Koneksi ke server gagal, periksa internet Anda' };
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    
    try {
      if (token) {
        await fetch(`${this.apiUrl}/auth`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'logout' })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
      }

      this.currentUserSubject.next(null);
    }
  }

  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.apiUrl}/auth`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      this.currentUserSubject.next(data.user);
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      this.logout();
      return false;
    }
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
