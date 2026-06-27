import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingItem, BookingSummary } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { UpdateProfileRequest } from '../models/api.models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card profile-shell">
      <div class="header-block">
        <div>
          <h2>{{ form.controls.profileName.value || currentUsername }}</h2>
          <p class="hint"><span>&#64;</span>{{ form.controls.username.value || currentUsername }} • {{ roleEmoji() }} {{ currentRole }}</p>
        </div>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <div class="profile-grid">
        <aside class="summary-card">
          <h3>Profile Summary</h3>
          <div class="summary-item">
            <span class="label">Profile Name</span>
            <strong>{{ form.controls.profileName.value || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">Username</span>
            <strong><span>&#64;</span>{{ form.controls.username.value || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">Email</span>
            <strong>{{ form.controls.email.value || 'Not set' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">Contact</span>
            <strong>{{ form.controls.contact.value || 'Not set' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">Age</span>
            <strong>{{ form.controls.age.value ?? 'Not set' }}</strong>
          </div>
        </aside>

        <div class="form-card">
          <h3>Edit Profile</h3>
          <p class="hint">Profile name and username are different. Username must remain unique.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="panel-form">
            <div class="grid-2">
              <label>
                Profile Name
                <input type="text" formControlName="profileName" />
              </label>
              <label>
                User Name
                <input type="text" formControlName="username" />
              </label>
              <label>
                Age
                <input type="number" min="0" formControlName="age" />
              </label>
              <label>
                Contact
                <input type="text" formControlName="contact" />
              </label>
            </div>

            <label>
              Email
              <input type="email" formControlName="email" />
            </label>

            <div class="grid-2">
              <label>
                Current Password
                <input type="password" formControlName="currentPassword" />
              </label>
              <label>
                New Password
                <input type="password" formControlName="newPassword" />
              </label>
            </div>

            <div class="actions-row">
              <button type="submit" [disabled]="busy">Save Profile</button>
            </div>
          </form>
        </div>
      </div>

      <div class="bookings-panel">
        <div class="row">
          <h3>My Booked Events</h3>
          <p class="hint">Total: {{ summary.totalBookings }} | Distinct events: {{ summary.distinctEvents }}</p>
        </div>

        <div class="table-wrap" *ngIf="bookings.length; else noBookings">
          <table class="pro-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Event</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let booking of bookings">
                <td>#{{ booking.bookingId }}</td>
                <td>{{ booking.event?.eventName || ('Event ' + booking.eventId) }}</td>
                <td>{{ booking.event?.eventDate ? (booking.event?.eventDate | date:'medium') : '-' }}</td>
                <td><button type="button" (click)="cancelBooking(booking.bookingId)">Cancel</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noBookings>
          <p class="hint">No booked events yet.</p>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .profile-shell {
      display: grid;
      gap: 16px;
    }

    .header-block h2 {
      margin: 0 0 4px;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 14px;
    }

    .summary-card,
    .form-card,
    .bookings-panel {
      border: 1px solid rgba(168, 216, 255, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      padding: 14px;
    }

    .summary-item {
      display: grid;
      gap: 2px;
      margin-bottom: 12px;
    }

    .label {
      color: #8fa6c6;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .actions-row {
      display: flex;
      justify-content: flex-end;
    }

    .pro-table {
      min-width: 620px;
    }

    @media (max-width: 980px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfilePageComponent {
  readonly form;
  bookings: BookingItem[] = [];
  summary: BookingSummary = { totalBookings: 0, distinctEvents: 0 };
  busy = false;
  errorMessage = '';
  successMessage = '';
  currentRole = '';
  currentUsername = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly bookingService: BookingService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      profileName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      age: [null as number | null],
      email: ['', [Validators.email]],
      contact: [''],
      currentPassword: [''],
      newPassword: ['']
    });

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.patchForm(currentUser);
    }

    this.authService.loadProfile().subscribe({
      next: (profile) => this.patchForm(profile),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load profile.';
      }
    });

    this.loadBookings();
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Provide valid profile details before saving.';
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.form.getRawValue();
    const payload: UpdateProfileRequest = {
      profileName: raw.profileName.trim(),
      username: raw.username.trim(),
      age: raw.age,
      email: raw.email.trim(),
      contact: raw.contact.trim(),
      currentPassword: raw.currentPassword.trim() || undefined,
      newPassword: raw.newPassword.trim() || undefined
    };

    this.authService.updateProfile(payload).subscribe({
      next: (profile) => {
        this.busy = false;
        this.patchForm(profile);
        this.form.patchValue({ currentPassword: '', newPassword: '' });
        this.successMessage = 'Profile updated.';
      },
      error: (err) => {
        this.busy = false;
        this.errorMessage = err?.error?.message ?? 'Profile update failed.';
      }
    });
  }

  roleEmoji(): string {
    switch (this.currentRole) {
      case 'Admin':
        return '👑';
      case 'Organizer':
        return '🛠️';
      default:
        return '🎟️';
    }
  }

  cancelBooking(bookingId: number): void {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking cancelled.';
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to cancel booking.';
      }
    });
  }

  private loadBookings(): void {
    this.bookingService.getBookings().subscribe({
      next: (items) => {
        this.bookings = items;
      },
      error: () => {
        this.bookings = [];
      }
    });

    this.bookingService.getSummary().subscribe({
      next: (value) => {
        this.summary = value;
      },
      error: () => {
        this.summary = { totalBookings: 0, distinctEvents: 0 };
      }
    });
  }

  private patchForm(profile: { profileName: string; username: string; age?: number | null; email: string; contact: string; role: string }): void {
    this.currentRole = profile.role;
    this.currentUsername = profile.username;
    this.form.patchValue({
      profileName: profile.profileName,
      username: profile.username,
      age: profile.age ?? null,
      email: profile.email,
      contact: profile.contact,
      currentPassword: '',
      newPassword: ''
    });
  }
}