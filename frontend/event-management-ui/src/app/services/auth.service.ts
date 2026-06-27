import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthProfile, CreateOrganizerRequest, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest } from '../models/api.models';
import { TokenStorageService } from './token-storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBase = 'http://localhost:5129/api/auth';
  private readonly currentUserSubject = new BehaviorSubject<AuthProfile | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router
  ) {
    if (this.tokenStorage.getToken()) {
      if (this.tokenStorage.isTokenExpired()) {
        this.logout();
        return;
      }

      this.startExpiryTimer();
      this.loadProfile().subscribe({
        next: (profile) => this.currentUserSubject.next(profile),
        error: () => this.logout()
      });
    }
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, payload).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.startExpiryTimer();
        this.currentUserSubject.next({
          userId: response.userId,
          profileName: response.profileName,
          username: response.username,
          age: null,
          email: '',
          contact: '',
          role: response.role
        });
      })
    );
  }

  register(payload: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/register`, payload).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.startExpiryTimer();
        this.currentUserSubject.next({
          userId: response.userId,
          profileName: response.profileName,
          username: response.username,
          age: null,
          email: '',
          contact: '',
          role: response.role
        });
      })
    );
  }

  createOrganizer(payload: CreateOrganizerRequest): Observable<AuthProfile> {
    return this.http.post<AuthProfile>(`${this.apiBase}/organizers`, payload);
  }

  loadProfile(): Observable<AuthProfile> {
    return this.http.get<AuthProfile>(`${this.apiBase}/me`).pipe(
      tap((profile) => this.currentUserSubject.next(profile))
    );
  }

  updateProfile(payload: UpdateProfileRequest): Observable<AuthProfile> {
    return this.http.put<AuthProfile>(`${this.apiBase}/profile`, payload).pipe(
      tap((profile) => this.currentUserSubject.next(profile))
    );
  }

  logout(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    this.tokenStorage.clearToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/upcoming-events']);
  }

  getCurrentUser(): AuthProfile | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.tokenStorage.getToken() && !this.tokenStorage.isTokenExpired();
  }

  private startExpiryTimer(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    const expiry = this.tokenStorage.getTokenExpiryEpochSeconds();
    if (!expiry) {
      return;
    }

    const timeout = (expiry * 1000) - Date.now();
    if (timeout <= 0) {
      this.logout();
      return;
    }

    this.expiryTimer = setTimeout(() => {
      this.logout();
    }, timeout);
  }
}
