import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventUpsertRequest } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="card create-shell">
      <div class="head-row">
        <div>
          <h2>Create Event</h2>
          <p class="hint">Publish instantly as admin, or send an approval request as organizer.</p>
        </div>
        <a routerLink="/manage-events" class="link-back">Back to Manage Events</a>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="panel-form">
        <div class="grid-2">
          <label>
            Event Name
            <input type="text" formControlName="eventName" />
          </label>

          <label>
            Event Date
            <input type="date" formControlName="eventDate" />
          </label>
        </div>

        <label>
          Description
          <textarea rows="4" formControlName="description"></textarea>
        </label>

        <label class="vacancy-field">
          Vacancy
          <input type="number" min="0" formControlName="vacancy" />
        </label>

        <div class="actions">
          <button type="submit" [disabled]="busy">Create Event</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .create-shell {
      display: grid;
      gap: 14px;
    }

    .head-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .head-row h2 {
      margin: 0 0 4px;
    }

    .link-back {
      color: #a8c6e0;
      text-decoration: none;
      border: 1px solid rgba(168, 216, 255, 0.3);
      border-radius: 10px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
    }

    .link-back:hover {
      color: #ecf3ff;
      border-color: rgba(168, 216, 255, 0.45);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .vacancy-field {
      max-width: 220px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 760px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }

      .vacancy-field {
        max-width: none;
      }
    }
  `]
})
export class CreateEventPageComponent {
  readonly form;
  busy = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      eventName: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      eventDate: ['', [Validators.required]],
      vacancy: [1, [Validators.required, Validators.min(0)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Fill all event fields correctly.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.busy = true;

    const raw = this.form.getRawValue();
    const selectedDate = new Date(`${raw.eventDate}T12:00:00`);
    const payload: EventUpsertRequest = {
      eventName: raw.eventName.trim(),
      description: raw.description.trim(),
      eventDate: selectedDate.toISOString(),
      vacancy: Number(raw.vacancy)
    };

    this.eventService.createEvent(payload).subscribe({
      next: (eventItem) => {
        this.busy = false;
        this.successMessage = this.authService.getCurrentUser()?.role === 'Admin'
          ? `Created and published event #${eventItem.eventId}.`
          : `Created event #${eventItem.eventId}. Waiting for admin approval.`;
        this.form.reset({
          eventName: '',
          description: '',
          eventDate: '',
          vacancy: 1
        });

        setTimeout(() => {
          this.router.navigate(['/manage-events']);
        }, 600);
      },
      error: (err) => {
        this.busy = false;
        this.errorMessage = err?.error?.message ?? 'Unable to create event.';
      }
    });
  }
}
