import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthProfile, UpdateUserRoleRequest } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  private readonly apiBase = 'http://localhost:5129/api/users';

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<AuthProfile[]> {
    return this.http.get<AuthProfile[]>(this.apiBase);
  }

  updateUserRole(userId: number, payload: UpdateUserRoleRequest): Observable<AuthProfile> {
    return this.http.put<AuthProfile>(`${this.apiBase}/${userId}/role`, payload);
  }
}
