import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookingService } from '../services/booking.service';
import { EventService } from '../services/event.service';
import { AuthService } from '../services/auth.service';
import { EventItem } from '../models/api.models';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <div class="row">
        <h2>Events</h2>
        <button type="button" (click)="fetchEvents()">Refresh</button>
      </div>

      <p class="hint" *ngIf="isAttendee">You can view and book available events.</p>

      <form [formGroup]="searchForm" (ngSubmit)="fetchEvents()" class="row search-row">
        <input type="text" formControlName="search" placeholder="Search events" />
        <button type="submit">Search</button>
      </form>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <ul class="list" *ngIf="events.length; else empty">
        <li *ngFor="let item of events">
          <div>
            <strong>#{{ item.eventId }} {{ item.eventName }}</strong>
            <div class="hint">{{ item.description }}</div>
            <div class="hint">Date: {{ item.eventDate | date:'medium' }}</div>
            <div class="hint">Vacancy: {{ item.remainingVacancy }} / {{ item.vacancy }}</div>
            <div class="error" *ngIf="item.isCancelled">Event cancelled</div>
            <div class="success" *ngIf="item.isBooked">Booked</div>
          </div>

          <div class="row">
            <button
              *ngIf="isAttendee && !item.isBooked"
              type="button"
              [disabled]="item.isCancelled || item.remainingVacancy <= 0"
              (click)="book(item)">Book</button>
            <button
              *ngIf="isAttendee && item.isBooked && item.bookingId"
              type="button"
              (click)="cancelBooking(item.bookingId)">Cancel</button>
          </div>
        </li>
      </ul>

      <ng-template #empty>
        <p class="hint">No events found.</p>
      </ng-template>
    </section>
  `
})
export class EventsPageComponent {
  readonly searchForm;
  events: EventItem[] = [];
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly eventService: EventService,
    private readonly bookingService: BookingService,
    private readonly authService: AuthService
  ) {
    this.searchForm = this.formBuilder.nonNullable.group({ search: [''] });
    this.fetchEvents();
  }

  get isAttendee(): boolean {
    return this.authService.getCurrentUser()?.role === 'Attendee';
  }

  fetchEvents(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const { search } = this.searchForm.getRawValue();

    this.eventService.getEvents(search).subscribe({
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
        this.successMessage = `Booked: ${item.eventName}`;
        this.fetchEvents();
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
        this.fetchEvents();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to cancel booking.';
      }
    });
  }
}
