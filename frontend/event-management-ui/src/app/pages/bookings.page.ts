import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { BookingItem, BookingSummary } from '../models/api.models';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>My Bookings</h2>

      <p class="hint">Total: {{ summary.totalBookings }} | Distinct events: {{ summary.distinctEvents }}</p>
      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <ul class="list" *ngIf="bookings.length; else emptyBookings">
        <li *ngFor="let booking of bookings">
          <div>
            <span>#{{ booking.bookingId }}</span>
            <strong>{{ booking.event?.eventName || ('Event ' + booking.eventId) }}</strong>
          </div>
          <button type="button" (click)="cancelBooking(booking.bookingId)">Cancel</button>
        </li>
      </ul>

      <ng-template #emptyBookings>
        <p class="hint">No bookings found.</p>
      </ng-template>
    </section>
  `
})
export class BookingsPageComponent {
  bookings: BookingItem[] = [];
  summary: BookingSummary = { totalBookings: 0, distinctEvents: 0 };
  errorMessage = '';

  constructor(private readonly bookingService: BookingService) {
    this.load();
  }

  load(): void {
    this.errorMessage = '';

    this.bookingService.getBookings().subscribe({
      next: (items) => {
        this.bookings = items;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load bookings.';
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

  cancelBooking(bookingId: number): void {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to cancel booking.';
      }
    });
  }
}
