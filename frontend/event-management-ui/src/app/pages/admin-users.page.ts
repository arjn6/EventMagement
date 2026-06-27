import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthProfile, UpdateUserRoleRequest } from '../models/api.models';
import { UserAdminService } from '../services/user-admin.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card users-shell">
      <div class="row title-row">
        <div>
          <h2>User Directory</h2>
          <p class="hint">Review account roles and update permissions.</p>
        </div>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <div class="table-wrap" *ngIf="users.length; else noUsers">
        <table class="pro-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Profile</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Update Role</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>#{{ user.userId }}</td>
              <td>
                <div class="name-cell">{{ user.profileName || user.username }}</div>
                <div class="subtle" *ngIf="user.age != null">Age: {{ user.age }}</div>
              </td>
              <td><span class="subtle"><span>&#64;</span>{{ user.username }}</span></td>
              <td>{{ user.email || 'Not set' }}</td>
              <td>{{ user.contact || 'Not set' }}</td>
              <td><span class="role-pill">{{ roleEmoji(user.role) }} {{ user.role }}</span></td>
              <td>
                <div class="inline-editor">
                  <select [(ngModel)]="user.role">
                    <option value="Attendee">🎫 Attendee</option>
                    <option value="Organizer">🛠️ Organizer</option>
                    <option value="Admin">👑 Admin</option>
                  </select>
                  <button type="button" (click)="saveRole(user)">💾 Save</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noUsers>
        <p class="hint">No users found.</p>
      </ng-template>
    </section>
  `,
  styles: [`
    .users-shell {
      display: grid;
      gap: 16px;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(168, 216, 255, 0.15);
    }

    .title-row h2 {
      margin: 0 0 6px;
      font-size: 26px;
      font-weight: 700;
      color: #ecf3ff;
    }

    .pro-table {
      min-width: 1000px;
    }

    .name-cell {
      color: #ecf3ff;
      font-weight: 700;
      font-size: 15px;
    }

    .subtle {
      color: #8fa6c6;
      font-size: 12px;
      font-weight: 500;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid rgba(33, 197, 122, 0.35);
      border-radius: 12px;
      color: #7ff0c9;
      background: rgba(33, 197, 122, 0.15);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .inline-editor {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .inline-editor select {
      min-width: 160px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(168, 216, 255, 0.3);
      background: rgba(3, 9, 18, 0.85);
      color: #edf6ff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .inline-editor select:hover {
      border-color: rgba(168, 216, 255, 0.45);
    }

    .inline-editor select:focus {
      outline: none;
      border-color: rgba(33, 197, 122, 0.6);
      box-shadow: 0 0 0 3px rgba(33, 197, 122, 0.15);
    }

    .inline-editor button {
      padding: 10px 16px;
      border: 0;
      border-radius: 8px;
      background: rgba(33, 197, 122, 0.18);
      color: #21c57a;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid rgba(33, 197, 122, 0.35);
    }

    .inline-editor button:hover {
      background: rgba(33, 197, 122, 0.28);
      border-color: rgba(33, 197, 122, 0.5);
      transform: scale(1.02);
    }

    @media (max-width: 720px) {
      .inline-editor {
        flex-direction: column;
      }

      .inline-editor select,
      .inline-editor button {
        width: 100%;
      }
    }
  `]
})
export class AdminUsersPageComponent {
  users: AuthProfile[] = [];
  errorMessage = '';
  successMessage = '';

  constructor(private readonly userAdminService: UserAdminService) {
    this.load();
  }

  roleEmoji(role: string): string {
    switch (role) {
      case 'Admin':
        return '👑';
      case 'Organizer':
        return '🛠️';
      default:
        return '🎟️';
    }
  }

  load(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.userAdminService.getUsers().subscribe({
      next: (items) => {
        this.users = items;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load users.';
      }
    });
  }

  saveRole(user: AuthProfile): void {
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpdateUserRoleRequest = { role: user.role as UpdateUserRoleRequest['role'] };
    this.userAdminService.updateUserRole(user.userId, payload).subscribe({
      next: () => {
        this.successMessage = `Updated role for ${user.username}.`;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to update role.';
      }
    });
  }
}
