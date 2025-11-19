import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Auto-login on app start
    this.autoLogin();
  }

  // Get current user value
  get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  get isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Check if user is admin
  get isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  // Signup
  signup(name: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/signup`, {
      name,
      email,
      password,
      role
    }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  // Login
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  // Logout
  logout(): void {
    // Clear auth data immediately
    this.clearAuthData();
    // Navigate to login
    this.router.navigate(['/login']);
  }

  // Get current user from server
  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/api/auth/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      })
    );
  }

  // Auto-login
  private autoLogin(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('currentUser');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        
        // Don't verify token on app start to avoid unnecessary requests
        // Token validation will happen on first API call
        // If token is invalid, the error interceptor will handle it
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  // Handle auth response
  private handleAuthResponse(response: AuthResponse): void {
    // Store token (use 'token' as key, but also support 'auth_token' for compatibility)
    localStorage.setItem('token', response.token);
    localStorage.setItem('auth_token', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    
    // Update current user
    this.currentUserSubject.next(response.user);
  }

  // Clear auth data
  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('auth_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Refresh token
  refreshToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ token: string; refreshToken: string }>(
      `${this.apiUrl}/api/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
      })
    );
  }
}
