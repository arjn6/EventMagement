import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventItem } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-upcoming-events-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header">
      <div class="page-title">
        <h2>🎉 Upcoming Events</h2>
        <p>Discover published events and book instantly when seats are available</p>
      </div>
    </section>

    <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
    <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

    <div class="events-grid" *ngIf="upcomingEvents.length; else noEvents">
      <div *ngFor="let item of upcomingEvents" class="event-card"
           [ngClass]="{'card-available': item.remainingVacancy > 0, 'card-full': item.remainingVacancy === 0, 'card-cancelled': item.isCancelled}">
        <div class="card-accent-bar"></div>
        <div class="card-body">
          <div class="event-header">
            <div class="event-title-row">
              <h3>{{ item.eventName }}</h3>
              <span class="event-id">#{{ item.eventId }}</span>
            </div>
            <span class="status-badge" [ngClass]="{'cancelled': item.isCancelled, 'available': item.remainingVacancy > 0, 'full': item.remainingVacancy === 0}">
              {{ item.isCancelled ? '🚫 Cancelled' : (item.remainingVacancy > 0 ? '✅ Available' : '🔴 Full') }}
            </span>
          </div>

          <p class="event-description">{{ item.description }}</p>

          <div class="event-details">
            <div class="detail-item">
              <span class="detail-label">📅 Date</span>
              <span class="detail-value">{{ item.eventDate | date:'MMM dd, yyyy · HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">🧑 Host</span>
              <span class="detail-value">{{ item.createdByProfileName || item.createdByUsername }}</span>
            </div>
          </div>

          <div class="seats-section">
            <div class="seats-row">
              <span class="seats-label">👥 Seats</span>
              <span class="seats-count" [ngClass]="{'seats-low': item.remainingVacancy > 0 && item.remainingVacancy <= 3}">
                {{ item.remainingVacancy }} / {{ item.vacancy }} available
              </span>
            </div>
            <div class="seats-bar">
              <div class="seats-fill"
                   [ngClass]="{'fill-available': item.remainingVacancy > 0, 'fill-full': item.remainingVacancy === 0}"
                   [style.width.%]="item.vacancy > 0 ? ((item.vacancy - item.remainingVacancy) / item.vacancy) * 100 : 100">
              </div>
            </div>
          </div>

          <div class="full-warning" *ngIf="item.remainingVacancy === 0">
            <span class="full-icon">😅</span>
            <span>Oops! Booking already full</span>
          </div>

          <div class="event-actions">
            <button
              *ngIf="isAttendee && !item.isBooked && item.remainingVacancy > 0"
              type="button"
              class="book-button"
              (click)="book(item)">
              🎟 Book Now
            </button>
            <button
              *ngIf="isAttendee && item.isBooked && item.bookingId"
              type="button"
              class="book-button secondary"
              (click)="cancelBooking(item.bookingId)">
              ✕ Cancel Booking
            </button>
            <a *ngIf="!isLoggedIn && item.remainingVacancy > 0" routerLink="/login" class="book-link">🎟 Book now</a>
          </div>
        </div>
      </div>
    </div>

    <ng-template #noEvents>
      <div class="empty-state">
        <p class="empty-icon">📭</p>
        <p class="empty-text">No upcoming events at this time</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title h2 {
      margin: 0 0 6px;
      font-size: 32px;
      color: #ecf3ff;
    }

    .page-title p {
      margin: 0;
      color: #a8c6e0;
      font-size: 15px;
    }

    .error {
      background: rgba(255, 159, 159, 0.1);
      border: 1px solid rgba(255, 159, 159, 0.3);
      color: #ff9f9f;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .success {
      background: rgba(143, 244, 197, 0.1);
      border: 1px solid rgba(143, 244, 197, 0.35);
      color: #8ff4c5;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }

    .event-card {
      background: linear-gradient(160deg, rgba(9, 22, 44, 0.95), rgba(6, 16, 33, 0.92));
      border: 1px solid rgba(160, 211, 255, 0.16);
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease;
    }

    .event-card:hover {
      transform: translateY(-7px);
      box-shadow: 0 20px 52px rgba(0, 0, 0, 0.35);
    }

    /* Status-coloured top accent bar */
    .card-accent-bar {
      height: 5px;
      width: 100%;
      flex-shrink: 0;
    }

    .card-available .card-accent-bar {
      background: linear-gradient(90deg, #21c57a, #1f8fff);
    }

    .card-full .card-accent-bar {
      background: linear-gradient(90deg, #ffb366, #ff7d54);
    }

    .card-cancelled .card-accent-bar {
      background: linear-gradient(90deg, #7a7a7a, #4a4a4a);
    }

    .card-available:hover {
      border-color: rgba(33, 197, 122, 0.4);
      box-shadow: 0 20px 52px rgba(33, 197, 122, 0.14);
    }

    .card-full:hover {
      border-color: rgba(255, 179, 102, 0.4);
      box-shadow: 0 20px 52px rgba(255, 124, 84, 0.12);
    }

    .card-body {
      padding: 22px 22px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    /* Header row: title + status badge */
    .event-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }

    .event-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .event-title-row h3 {
      margin: 0;
      font-size: 19px;
      font-weight: 800;
      color: #edf5ff;
      line-height: 1.3;
      flex: 1;
    }

    .event-id {
      font-size: 10px;
      color: #5a7899;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: rgba(31, 143, 255, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
      border: 1px solid rgba(31, 143, 255, 0.2);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 13px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      border: 1px solid;
      align-self: flex-start;
    }

    .status-badge.available {
      background: rgba(33, 197, 122, 0.13);
      color: #21c57a;
      border-color: rgba(33, 197, 122, 0.32);
    }

    .status-badge.full {
      background: rgba(255, 159, 99, 0.13);
      color: #ffb366;
      border-color: rgba(255, 159, 99, 0.32);
    }

    .status-badge.cancelled {
      background: rgba(140, 140, 140, 0.12);
      color: #9aacbf;
      border-color: rgba(140, 140, 140, 0.25);
    }

    .event-description {
      margin: 0 0 16px;
      color: #a8c6e0;
      font-size: 14px;
      line-height: 1.65;
      flex-grow: 1;
    }

    .event-details {
      display: grid;
      gap: 10px;
      margin-bottom: 14px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(168, 216, 255, 0.1);
      border-radius: 12px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .detail-label {
      color: #7a95b5;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.35px;
    }

    .detail-value {
      color: #d0e1ff;
      font-size: 13px;
      font-weight: 700;
    }

    /* Seats progress bar */
    .seats-section {
      margin-bottom: 14px;
    }

    .seats-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .seats-label {
      color: #7a95b5;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.35px;
    }

    .seats-count {
      font-size: 12px;
      font-weight: 700;
      color: #a8c6e0;
    }

    .seats-low {
      color: #ffb366;
    }

    .seats-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
    }

    .seats-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    }

    .fill-available {
      background: linear-gradient(90deg, #21c57a, #1f8fff);
    }

    .fill-full {
      background: linear-gradient(90deg, #ffb366, #ff7d54);
    }

    /* Full warning message */
    .full-warning {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 14px;
      padding: 12px 16px;
      background: rgba(255, 159, 99, 0.1);
      border: 1px solid rgba(255, 159, 99, 0.28);
      border-radius: 12px;
      color: #ffb366;
      font-size: 13px;
      font-weight: 700;
    }

    .full-icon {
      font-size: 18px;
    }

    /* Actions */
    .event-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: auto;
      padding-top: 4px;
    }

    .book-button {
      flex: 1;
      max-width: 220px;
      padding: 12px 20px;
      border-radius: 10px;
      border: 0;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: linear-gradient(135deg, #21c57a, #1f8fff);
      color: #02152b;
      box-shadow: 0 4px 14px rgba(33, 197, 122, 0.22);
    }

    .book-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(33, 197, 122, 0.32);
    }

    .book-button.secondary {
      background: rgba(255, 255, 255, 0.07);
      color: #d0e1ff;
      border: 1px solid rgba(168, 216, 255, 0.28);
      box-shadow: none;
    }

    .book-button.secondary:hover {
      background: rgba(255, 80, 80, 0.1);
      border-color: rgba(255, 120, 120, 0.4);
      color: #ff9f9f;
    }

    .book-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      max-width: 220px;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      background: linear-gradient(135deg, #21c57a, #1f8fff);
      color: #02152b;
      box-shadow: 0 4px 14px rgba(33, 197, 122, 0.22);
      transition: all 0.2s ease;
    }

    .book-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(33, 197, 122, 0.32);
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }

    .empty-icon {
      font-size: 72px;
      margin: 0 0 20px;
      line-height: 1;
    }

    .empty-text {
      margin: 0;
      color: #a8c6e0;
      font-size: 18px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .events-grid { grid-template-columns: 1fr; gap: 20px; }
      .page-header { flex-direction: column; align-items: stretch; }
      .card-body { padding: 18px; }
      .event-title-row h3 { font-size: 17px; }
      .book-button, .book-link { max-width: none; }
    }
  `]
})
export class UpcomingEventsPageComponent {
  events: EventItem[] = [];
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly bookingService: BookingService
  ) {
    this.load();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAttendee(): boolean {
    return this.authService.getCurrentUser()?.role === 'Attendee';
  }

  get upcomingEvents(): EventItem[] {
    const now = Date.now();
    return this.events
      .filter((item) => !item.isCancelled && new Date(item.eventDate).getTime() >= now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }

  load(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getEvents().subscribe({
      next: (items) => {
        this.events = items;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load events.';
      }
    });
  }

  book(item: EventItem): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.bookingService.createBooking(item.eventId).subscribe({
      next: () => {
        this.successMessage = `Booked ${item.eventName}.`;
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Booking failed.';
      }
    });
  }

  cancelBooking(bookingId: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking cancelled.';
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to cancel booking.';
      }
    });
  }
}
