import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventItem, EventUpsertRequest } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiBase = 'http://localhost:5129/api/events';

  constructor(private readonly http: HttpClient) {}

  getEvents(search?: string): Observable<EventItem[]> {
    const trimmed = search?.trim();
    if (!trimmed) {
      return this.http.get<EventItem[]>(this.apiBase);
    }

    return this.http.get<EventItem[]>(`${this.apiBase}?search=${encodeURIComponent(trimmed)}`);
  }

  createEvent(payload: EventUpsertRequest): Observable<EventItem> {
    return this.http.post<EventItem>(this.apiBase, payload);
  }

  updateEvent(eventId: number, payload: EventUpsertRequest): Observable<EventItem> {
    return this.http.put<EventItem>(`${this.apiBase}/${eventId}`, payload);
  }

  getApprovalRequests(): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(`${this.apiBase}/approval-requests`);
  }

  approveEvent(eventId: number): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.apiBase}/${eventId}/approve`, {});
  }

  deleteEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${eventId}`);
  }

  cancelEventByAdmin(eventId: number): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.apiBase}/${eventId}/cancel`, {});
  }
}
