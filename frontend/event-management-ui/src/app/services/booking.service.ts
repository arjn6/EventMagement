import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingItem, BookingSummary, EventBookingItem } from '../models/api.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiBase = `${environment.apiUrl}/api/bookings`;

  constructor(private readonly http: HttpClient) {}

  getBookings(): Observable<BookingItem[]> {
    return this.http.get<BookingItem[]>(`${this.apiBase}/history`);
  }

  createBooking(eventId: number): Observable<BookingItem> {
    return this.http.post<BookingItem>(this.apiBase, { eventId });
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${bookingId}`);
  }

  getSummary(): Observable<BookingSummary> {
    return this.http.get<BookingSummary>(`${this.apiBase}/summary`);
  }

  getEventBookings(eventId: number): Observable<EventBookingItem[]> {
    return this.http.get<EventBookingItem[]>(`${this.apiBase}/event/${eventId}`);
  }
}
