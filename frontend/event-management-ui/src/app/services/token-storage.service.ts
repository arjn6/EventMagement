import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly tokenKey = 'event_management_jwt';

  setToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  isTokenExpired(bufferSeconds = 0): boolean {
    const expiry = this.getTokenExpiryEpochSeconds();
    if (!expiry) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return expiry <= now + bufferSeconds;
  }

  getTokenExpiryEpochSeconds(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decoded = typeof window === 'undefined' ? '' : atob(padded);
      if (!decoded) {
        return null;
      }

      const obj = JSON.parse(decoded) as { exp?: number };
      return typeof obj.exp === 'number' ? obj.exp : null;
    } catch {
      return null;
    }
  }
}
