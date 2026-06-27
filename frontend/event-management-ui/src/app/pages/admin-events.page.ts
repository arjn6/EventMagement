import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../services/event.service';
import { EventItem, EventUpsertRequest } from '../models/api.models';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-events-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="card manage-shell">
      <div class="title-row">
        <div>
          <h2>{{ isAdmin ? 'Event Control Center' : 'Organizer Event Desk' }}</h2>
          <p class="hint">Manage existing events here. Use the dedicated Create Event screen for new events.</p>
        </div>
        <a routerLink="/create-event" class="create-link">+ Create Event</a>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <section class="approval-card">
        <h3>Event Management</h3>
        <p class="hint">Edit and manage your published or pending events here.</p>

      <div class="table-wrap" *ngIf="events.length; else noEvents">
        <table class="pro-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Date</th>
              <th>Vacancy</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of events">
              <td>#{{ item.eventId }}</td>
              <td>
                <div class="event-title">{{ item.eventName }}</div>
                <div class="event-subtle">{{ item.description }}</div>
                <div class="error" *ngIf="item.isCancelled">Cancelled</div>
              </td>
              <td>{{ item.eventDate | date:'medium' }}</td>
              <td>{{ item.remainingVacancy }} / {{ item.vacancy }}</td>
              <td>{{ item.createdByProfileName || item.createdByUsername }} (<span class="inline-at">&#64;</span>{{ item.createdByUsername }})</td>
              <td><span class="status-chip" [ngClass]="statusClass(item.approvalStatus)">{{ formatStatus(item.approvalStatus) }}</span></td>
              <td>
                <div class="action-set horizontal">
                  <button type="button" class="icon-btn" (click)="startEdit(item)" title="Edit event" aria-label="Edit event" data-tip="Edit event">✎</button>
                  <button type="button" class="icon-btn" (click)="viewBookings(item)" title="View bookings" aria-label="View bookings" data-tip="View bookings">👥</button>
                  <button type="button" class="icon-btn" [disabled]="!item.canDelete" (click)="deleteEvent(item)" [title]="isAdmin ? 'Delete event' : 'Request delete'" [attr.aria-label]="isAdmin ? 'Delete event' : 'Request delete'" [attr.data-tip]="isAdmin ? 'Delete event' : 'Request delete'">🗑</button>
                  <button type="button" class="icon-btn" *ngIf="isAdmin" [disabled]="item.isCancelled" (click)="cancelEvent(item.eventId)" title="Cancel event" aria-label="Cancel event" data-tip="Cancel event">⛔</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #noEvents>
        <p class="hint">No events found.</p>
      </ng-template>
      </section>

      <div class="edit-modal-backdrop" *ngIf="editingEventId" (click)="resetForm()"></div>
      <section class="edit-modal card" *ngIf="editingEventId" role="dialog" aria-modal="true" aria-label="Edit event">
        <div class="row modal-head">
          <h3>Edit Event #{{ editingEventId }}</h3>
          <button type="button" class="icon-btn" (click)="resetForm()" title="Close" aria-label="Close">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="panel-form">
          <div class="edit-grid">
            <label>
              Event Name
              <input type="text" formControlName="eventName" />
            </label>
            <label>
              Event Date
              <input type="date" formControlName="eventDate" />
            </label>
            <label class="full-row">
              Description
              <textarea formControlName="description" rows="3"></textarea>
            </label>
            <label>
              Vacancy
              <input type="number" min="0" formControlName="vacancy" />
            </label>
          </div>

          <div class="actions-row">
            <button type="button" class="secondary-btn" (click)="resetForm()">Cancel</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </section>

      <!-- Delete / Cancel confirmation modal -->
      <div class="modal-backdrop" *ngIf="pendingAction" (click)="dismissConfirm()"></div>
      <div class="confirm-modal card" *ngIf="pendingAction" role="dialog" aria-modal="true">
        <div class="confirm-icon">
          {{ pendingAction.type === 'delete' ? '🗑️' : '⛔' }}
        </div>
        <h3>{{ pendingAction.type === 'delete' ? (isAdmin ? 'Delete Event' : 'Request Delete') : 'Cancel Event' }}</h3>
        <div class="confirm-details">
          <div class="confirm-row">
            <span class="confirm-label">Event ID</span>
            <span class="confirm-value">#{{ pendingAction.eventId }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Event</span>
            <span class="confirm-value">{{ pendingAction.eventName }}</span>
          </div>
        </div>
        <p class="confirm-note">
          <ng-container *ngIf="pendingAction.type === 'delete'">
            {{ isAdmin ? 'This will permanently delete the event and all related bookings.' : 'A delete request will be submitted for admin review.' }}
          </ng-container>
          <ng-container *ngIf="pendingAction.type === 'cancel'">
            Cancelling an event will notify all attendees. This action cannot be undone.
          </ng-container>
        </p>
        <div class="confirm-actions">
          <button class="cancel-btn" (click)="dismissConfirm()">Go Back</button>
          <button class="danger-btn" (click)="executeConfirm()">
            {{ pendingAction.type === 'delete' ? (isAdmin ? '🗑️ Delete' : '📤 Submit Request') : '⛔ Cancel Event' }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .manage-shell { display: grid; gap: 20px; }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(168, 216, 255, 0.15);
    }

    .title-row h2 { margin: 0 0 6px; font-size: 26px; font-weight: 700; color: #ecf3ff; }
    .title-row > div:first-child { flex: 1; }
    .title-row .hint { margin-top: 4px; }

    .create-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #02152b;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 10px;
      background: linear-gradient(135deg, #21c57a, #1f8fff);
      box-shadow: 0 4px 12px rgba(33, 197, 122, 0.2);
      transition: all 0.2s ease;
      white-space: nowrap;
      font-size: 14px;
    }

    .create-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(33, 197, 122, 0.3);
    }

    .approval-card {
      border: 1px solid rgba(168, 216, 255, 0.15);
      border-radius: 14px;
      padding: 18px;
      background: rgba(255, 255, 255, 0.02);
    }

    .approval-card h3 {
      margin: 0 0 6px;
      font-size: 18px;
      color: #ecf3ff;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .approval-card h3::before { font-size: 20px; }

    .event-title {
      font-weight: 700;
      color: #ecf3ff;
      margin-bottom: 4px;
      font-size: 15px;
    }

    .event-subtle {
      color: #8fa6c6;
      font-size: 12px;
      max-width: 40ch;
      line-height: 1.4;
    }

    .action-set {
      display: grid;
      gap: 6px;
    }

    .action-set.horizontal {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      min-width: 36px;
      height: 36px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 16px;
      background: rgba(255, 255, 255, 0.08);
      color: #d9e9ff;
      border: 1px solid rgba(168, 216, 255, 0.22);
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .icon-btn:hover:not(:disabled) {
      background: rgba(33, 197, 122, 0.15);
      border-color: rgba(33, 197, 122, 0.35);
      color: #21c57a;
      transform: scale(1.08);
    }

    .icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon-btn[data-tip] {
      position: relative;
    }

    .icon-btn[data-tip]::after {
      content: attr(data-tip);
      position: absolute;
      left: 50%;
      bottom: calc(100% + 10px);
      transform: translateX(-50%);
      background: rgba(6, 18, 36, 0.96);
      color: #d7e8ff;
      border: 1px solid rgba(168, 216, 255, 0.3);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 10;
    }

    .icon-btn[data-tip]::before {
      content: '';
      position: absolute;
      left: 50%;
      bottom: calc(100% + 5px);
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(6, 18, 36, 0.96);
      opacity: 0;
      transition: opacity 0.15s ease;
      pointer-events: none;
      z-index: 10;
    }

    .icon-btn[data-tip]:hover::after,
    .icon-btn[data-tip]:hover::before {
      opacity: 1;
    }

    .edit-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 16px;
    }

    .edit-grid .full-row {
      grid-column: 1 / -1;
    }

    .edit-grid label {
      display: grid;
      gap: 6px;
    }

    .actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(168, 216, 255, 0.15);
    }

    .secondary-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #d5e5fb;
      border: 1px solid rgba(168, 216, 255, 0.25);
      padding: 10px 18px;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .secondary-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(168, 216, 255, 0.4);
    }

    .edit-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 100;
      backdrop-filter: blur(4px);
    }

    .edit-modal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(780px, calc(100vw - 24px));
      z-index: 101;
      margin: 0;
      padding: 24px;
      border: 1px solid rgba(168, 216, 255, 0.25);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
      background: linear-gradient(180deg, rgba(10, 24, 46, 0.96), rgba(7, 19, 38, 0.94));
      animation: modalSlideIn 0.2s ease;
    }

    @keyframes modalSlideIn {
      from { opacity: 0; transform: translate(-50%, -48%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(168, 216, 255, 0.15);
    }

    .modal-head h3 {
      margin: 0;
      font-size: 20px;
      color: #ecf3ff;
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .title-row { flex-direction: column; }
      .title-row > div:first-child { width: 100%; }
      .create-link { width: 100%; justify-content: center; }
      .edit-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminEventsPageComponent {
  readonly form;
  events: EventItem[] = [];
  editingEventId: number | null = null;
  errorMessage = '';
  successMessage = '';
  pendingAction: { type: 'delete' | 'cancel'; eventId: number; eventName: string; item?: EventItem } | null = null;

  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      eventName: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      eventDate: ['', [Validators.required]],
      vacancy: [1, [Validators.required, Validators.min(0)]]
    });

    this.load();
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'Admin';
  }

  get pendingApprovalItems(): EventItem[] {
    return [];
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

  submit(): void {
    if (!this.editingEventId) {
      return;
    }

    if (this.form.invalid) {
      this.errorMessage = 'Fill all event fields correctly.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.form.getRawValue();
    const selectedDate = new Date(`${raw.eventDate}T12:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      this.errorMessage = 'Select a valid event date.';
      return;
    }

    const payload: EventUpsertRequest = {
      eventName: raw.eventName.trim(),
      description: raw.description.trim(),
      eventDate: selectedDate.toISOString(),
      vacancy: Number(raw.vacancy)
    };

    this.eventService.updateEvent(this.editingEventId, payload).subscribe({
      next: (eventItem) => {
        this.successMessage = `Updated event #${eventItem.eventId}.`;
        this.resetForm();
        this.load();
      },
      error: (err) => {
        if (err?.status === 403) {
          this.errorMessage = 'You are not allowed to edit this event.';
          return;
        }

        if (err?.status === 401) {
          this.errorMessage = 'Please login again to edit events.';
          return;
        }

        this.errorMessage = err?.error?.message ?? 'Unable to save event.';
      }
    });
  }

  startEdit(item: EventItem): void {
    this.editingEventId = item.eventId;
    this.form.setValue({
      eventName: item.eventName,
      description: item.description,
      eventDate: this.toDateInputValue(item.eventDate),
      vacancy: item.vacancy
    });
  }

  deleteEvent(item: EventItem): void {
    this.pendingAction = { type: 'delete', eventId: item.eventId, eventName: item.eventName, item };
  }

  approve(eventId: number): void {
    // Approval is now handled in the Requests page
  }

  viewBookings(item: EventItem): void {
    this.router.navigate(['/event-bookings', item.eventId], { queryParams: { name: item.eventName } });
  }

  cancelEvent(eventId: number): void {
    const found = this.events.find(e => e.eventId === eventId);
    this.pendingAction = { type: 'cancel', eventId, eventName: found?.eventName ?? `Event #${eventId}` };
  }

  dismissConfirm(): void {
    this.pendingAction = null;
  }

  executeConfirm(): void {
    if (!this.pendingAction) return;
    const action = this.pendingAction;
    this.pendingAction = null;
    this.errorMessage = '';
    this.successMessage = '';

    if (action.type === 'delete' && action.item) {
      this.eventService.deleteEvent(action.item.eventId).subscribe({
        next: () => {
          this.successMessage = this.isAdmin
            ? `Deleted event #${action.eventId}.`
            : `Delete request submitted for event #${action.eventId}.`;
          if (this.editingEventId === action.eventId) this.resetForm();
          this.load();
        },
        error: (err) => { this.errorMessage = err?.error?.message ?? 'Unable to delete event.'; }
      });
    } else if (action.type === 'cancel') {
      this.eventService.cancelEventByAdmin(action.eventId).subscribe({
        next: () => {
          this.successMessage = `Event #${action.eventId} cancelled.`;
          this.load();
        },
        error: (err) => { this.errorMessage = err?.error?.message ?? 'Unable to cancel event.'; }
      });
    }
  }

  resetForm(): void {
    this.editingEventId = null;
    this.form.reset({
      eventName: '',
      description: '',
      eventDate: '',
      vacancy: 1
    });
  }

  private toDateInputValue(value: string): string {
    const date = new Date(value);
    return date.toISOString().slice(0, 10);
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'PendingApproval':
        return 'Pending approval';
      case 'DeletePending':
        return 'Delete pending';
      case 'Deleted':
        return 'Deleted';
      default:
        return 'Approved';
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PendingApproval':
        return 'pending';
      case 'DeletePending':
        return 'danger';
      default:
        return 'approved';
    }
  }
}
