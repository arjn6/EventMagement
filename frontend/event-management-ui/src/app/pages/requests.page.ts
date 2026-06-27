import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventItem } from '../models/api.models';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-requests-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Confirmation Modal -->
    <div class="modal-backdrop" *ngIf="confirmingItem" (click)="cancelConfirm()"></div>
    <div class="confirm-modal card" *ngIf="confirmingItem" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="confirm-icon">✅</div>
      <h3 id="confirm-title">Confirm Approval</h3>
      <div class="confirm-details">
        <div class="confirm-row">
          <span class="confirm-label">Event</span>
          <span class="confirm-value">{{ confirmingItem.eventName }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">Organizer</span>
          <span class="confirm-value">{{ confirmingItem.createdByProfileName || confirmingItem.createdByUsername }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">Request Type</span>
          <span class="status-chip" [ngClass]="statusClass(confirmingItem.approvalStatus)">{{ formatStatus(confirmingItem.approvalStatus) }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">Seats</span>
          <span class="confirm-value">{{ confirmingItem.vacancy }}</span>
        </div>
      </div>
      <p class="confirm-note">This will publish or remove the event. This action cannot be undone.</p>
      <div class="confirm-actions">
        <button type="button" class="cancel-btn" (click)="cancelConfirm()">Cancel</button>
        <button type="button" class="confirm-btn" (click)="confirmApprove()">✔ Yes, Approve</button>
      </div>
    </div>

    <section class="card requests-shell">
      <div class="page-header-row">
        <div>
          <h2>Requests</h2>
          <p class="hint">Manage event approval requests from organizers.</p>
        </div>
        <button type="button" class="refresh-btn" (click)="load()" title="Refresh">↻ Refresh</button>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <!-- Pending Requests -->
      <section class="req-section">
        <h3>⏳ Pending Approval Requests</h3>
        <p class="hint">Add and delete requests awaiting your decision.</p>

        <div class="table-wrap" *ngIf="pendingItems.length; else noPending">
          <table class="pro-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Organizer</th>
                <th>Seats</th>
                <th>Request Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of pendingItems">
                <td>#{{ item.eventId }}</td>
                <td>
                  <div class="event-name">{{ item.eventName }}</div>
                  <div class="event-desc">{{ item.description }}</div>
                </td>
                <td>{{ item.createdByProfileName || item.createdByUsername }}<br><span class="subtle">&#64;{{ item.createdByUsername }}</span></td>
                <td>{{ item.remainingVacancy }} / {{ item.vacancy }}</td>
                <td><span class="status-chip" [ngClass]="statusClass(item.approvalStatus)">{{ formatStatus(item.approvalStatus) }}</span></td>
                <td>
                  <button type="button" class="icon-btn approve-btn" *ngIf="item.canApprove" (click)="openConfirm(item)" title="Approve" data-tip="Approve request">✔</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noPending>
          <div class="empty-req">
            <span>🎉</span>
            <p>No pending requests. All clear!</p>
          </div>
        </ng-template>
      </section>

      <!-- Approval History -->
      <section class="req-section">
        <h3>📋 Approval History</h3>
        <p class="hint">Previously processed requests.</p>

        <div class="table-wrap" *ngIf="historyItems.length; else noHistory">
          <table class="pro-table compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Organizer</th>
                <th>Status</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of historyItems">
                <td>#{{ item.eventId }}</td>
                <td>{{ item.eventName }}</td>
                <td>{{ item.createdByProfileName || item.createdByUsername }} (<span class="inline-at">&#64;</span>{{ item.createdByUsername }})</td>
                <td><span class="status-chip" [ngClass]="statusClass(item.approvalStatus)">{{ formatStatus(item.approvalStatus) }}</span></td>
                <td>{{ (item.approvedAtUtc || item.approvalRequestedAtUtc || item.eventDate) | date:'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noHistory>
          <p class="hint">No history yet.</p>
        </ng-template>
      </section>
    </section>
  `,
  styles: [`
    .requests-shell { display: grid; gap: 24px; }

    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(168, 216, 255, 0.15);
    }

    .page-header-row h2 {
      margin: 0 0 6px;
      font-size: 26px;
      font-weight: 700;
      color: #ecf3ff;
    }

    .refresh-btn {
      padding: 10px 16px;
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

    .req-section {
      border: 1px solid rgba(168, 216, 255, 0.15);
      border-radius: 14px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.02);
    }

    .req-section h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
      color: #ecf3ff;
    }

    .event-name {
      font-weight: 700;
      color: #ecf3ff;
      font-size: 15px;
    }

    .event-desc {
      font-size: 12px;
      color: #8fa6c6;
      max-width: 40ch;
      line-height: 1.4;
    }

    .subtle {
      color: #8fa6c6;
      font-size: 12px;
      font-weight: 500;
    }

    .empty-req {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px 20px;
      color: #8fa6c6;
      font-size: 14px;
      text-align: center;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
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
    }

    .approve-btn {
      background: rgba(33, 197, 122, 0.15);
      border-color: rgba(33, 197, 122, 0.35);
      color: #21c57a;
      font-size: 16px;
      min-width: 100px;
    }

    .approve-btn:hover {
      background: rgba(33, 197, 122, 0.25);
      border-color: rgba(33, 197, 122, 0.5);
      transform: scale(1.05);
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

    .icon-btn[data-tip]:hover::after { opacity: 1; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 100;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .confirm-modal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(520px, calc(100vw - 24px));
      z-index: 101;
      margin: 0;
      padding: 32px 28px;
      text-align: center;
      display: grid;
      gap: 20px;
      border: 1px solid rgba(168, 216, 255, 0.25);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(10, 24, 46, 0.96), rgba(7, 19, 38, 0.94));
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
      animation: modalSlideIn 0.25s ease;
    }

    @keyframes modalSlideIn {
      from { opacity: 0; transform: translate(-50%, -48%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    .confirm-modal h3 {
      margin: 0;
      font-size: 24px;
      color: #ecf3ff;
      font-weight: 700;
    }

    .confirm-details {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(168, 216, 255, 0.18);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
    }

    .confirm-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .confirm-label {
      color: #7a95b5;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .confirm-value {
      color: #d0e1ff;
      font-weight: 700;
    }

    .confirm-note {
      color: #a8c6e0;
      font-size: 13px;
      margin: 0;
      padding: 12px 14px;
      background: rgba(255, 200, 100, 0.08);
      border: 1px solid rgba(255, 200, 100, 0.25);
      border-radius: 10px;
    }

    .confirm-actions {
      display: flex;
      justify-content: center;
      gap: 14px;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #21c57a, #1f8fff);
      color: #02152b;
      font-weight: 700;
      border: 0;
      padding: 12px 28px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(33, 197, 122, 0.2);
      transition: all 0.2s ease;
    }

    .confirm-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(33, 197, 122, 0.3);
    }

    .cancel-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #d5e5fb;
      border: 1px solid rgba(168, 216, 255, 0.25);
      padding: 12px 28px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(168, 216, 255, 0.4);
    }

    @media (max-width: 720px) {
      .page-header-row { flex-direction: column; }
      .confirm-actions { flex-direction: column; }
      .confirm-btn, .cancel-btn { width: 100%; }
    }
  `]
})
export class RequestsPageComponent {
  items: EventItem[] = [];
  errorMessage = '';
  successMessage = '';
  confirmingItem: EventItem | null = null;

  constructor(private readonly eventService: EventService) {
    this.load();
  }

  get pendingItems(): EventItem[] {
    return this.items.filter((item) => item.approvalStatus === 'PendingApproval' || item.approvalStatus === 'DeletePending');
  }

  get historyItems(): EventItem[] {
    return this.items.filter((item) => item.approvalStatus === 'Approved' || item.approvalStatus === 'Deleted');
  }

  load(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.getApprovalRequests().subscribe({
      next: (items) => {
        this.items = items;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load requests. Please check if the backend is running.';
      }
    });
  }

  openConfirm(item: EventItem): void {
    this.confirmingItem = item;
  }

  cancelConfirm(): void {
    this.confirmingItem = null;
  }

  confirmApprove(): void {
    if (!this.confirmingItem) {
      return;
    }

    const eventId = this.confirmingItem.eventId;
    this.confirmingItem = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService.approveEvent(eventId).subscribe({
      next: () => {
        this.successMessage = `Approval processed for event #${eventId}.`;
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to process approval.';
      }
    });
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
