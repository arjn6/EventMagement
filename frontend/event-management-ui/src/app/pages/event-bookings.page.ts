import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventBookingItem } from '../models/api.models';
import { BookingService } from '../services/booking.service';

@Component({
  selector: 'app-event-bookings-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card bookings-shell">
      <div class="page-header-row">
        <div>
          <a routerLink="/manage-events" class="back-link">← Back to Events</a>
          <h2 class="page-title">{{ eventName }}</h2>
          <p class="hint">People who have booked this event.</p>
        </div>
        <div class="header-actions">
          <span class="seat-badge">🎟️ {{ items.length }} booked</span>
          <button type="button" class="refresh-btn" (click)="load()">↻ Refresh</button>
        </div>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <div class="loading-row" *ngIf="loading">
        <span>Loading bookings…</span>
      </div>

      <div class="table-wrap" *ngIf="!loading && items.length; else noBookings">
        <table class="pro-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Booking ID</th>
              <th>Profile Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items; let i = index">
              <td class="row-num">{{ i + 1 }}</td>
              <td><span class="booking-id">#{{ item.bookingId }}</span></td>
              <td>
                <div class="name-cell">{{ item.profileName || item.username }}</div>
              </td>
              <td><span class="subtle">&#64;{{ item.username }}</span></td>
              <td>{{ item.email || '—' }}</td>
              <td>{{ item.contact || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noBookings>
        <div class="empty-state" *ngIf="!loading">
          <span class="empty-icon">🎫</span>
          <p>No bookings for this event yet.</p>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .bookings-shell {
      display: grid;
      gap: 20px;
    }

    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(168, 216, 255, 0.15);
    }

    .back-link {
      display: inline-block;
      color: #8fa6c6;
      text-decoration: none;
      font-size: 13px;
      margin-bottom: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .back-link:hover {
      color: #21c57a;
      transform: translateX(-2px);
    }

    .page-title {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: #ecf3ff;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .seat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(31, 143, 255, 0.15);
      border: 1px solid rgba(31, 143, 255, 0.3);
      border-radius: 12px;
      color: #7ec8ff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .refresh-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid rgba(168, 216, 255, 0.3);
      background: rgba(255, 255, 255, 0.07);
      color: #afc6e4;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ecf3ff;
      border-color: rgba(168, 216, 255, 0.45);
    }

    .loading-row {
      padding: 32px 20px;
      text-align: center;
      color: #8fa6c6;
      font-size: 14px;
    }

    .row-num {
      color: #6a7c9e;
      font-size: 12px;
      font-weight: 600;
    }

    .booking-id {
      font-family: 'Courier New', monospace;
      background: rgba(31, 143, 255, 0.12);
      border: 1px solid rgba(31, 143, 255, 0.25);
      padding: 3px 8px;
      border-radius: 6px;
      color: #7ec8ff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .name-cell {
      font-weight: 700;
      color: #ecf3ff;
      font-size: 15px;
    }

    .subtle {
      color: #8fa6c6;
      font-size: 13px;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 60px 20px;
      color: #8fa6c6;
      text-align: center;
    }

    .empty-icon {
      font-size: 56px;
      line-height: 1;
      margin-bottom: 8px;
    }

    @media (max-width: 720px) {
      .page-header-row {
        flex-direction: column;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .seat-badge,
      .refresh-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EventBookingsPageComponent implements OnInit {
  eventId = 0;
  eventName = '';
  items: EventBookingItem[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.eventName = this.route.snapshot.queryParamMap.get('name') ?? `Event #${this.eventId}`;
    this.load();
  }

  load(): void {
    if (!this.eventId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.bookingService.getEventBookings(this.eventId).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load bookings. Check if the backend is running.';
        this.loading = false;
      }
    });
  }
}
