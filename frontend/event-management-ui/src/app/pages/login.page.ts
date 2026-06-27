import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="auth-hero">
        <h2>Welcome Back</h2>
        <p>Sign in to manage bookings, profile, and event activities.</p>
      </div>

      <div class="auth-card">
      <h3>Login</h3>
      <p class="hint">Use your credentials to continue.</p>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Username
          <input type="text" formControlName="username" />
        </label>
        <label>
          Password
          <div class="password-wrap">
            <input [type]="showPassword ? 'text' : 'password'" formControlName="password" />
            <button type="button" class="toggle-password" (click)="togglePassword()">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
        </label>
        <button type="submit" [disabled]="busy">Login</button>
      </form>

      <a routerLink="/register">Create a new account</a>
      </div>
    </section>
  `,
  styles: [`
    .auth-shell {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 20px;
      align-items: stretch;
    }

    .auth-hero,
    .auth-card {
      border-radius: 16px;
      border: 1px solid rgba(168, 216, 255, 0.26);
      padding: 24px;
      background: linear-gradient(160deg, rgba(8, 22, 42, 0.92), rgba(4, 14, 30, 0.88));
    }

    .auth-hero h2 {
      margin: 0 0 8px;
      font-size: 34px;
    }

    .auth-hero p {
      margin: 0;
      color: #b8d2ed;
      max-width: 32ch;
    }

    .auth-card h3 {
      margin: 0 0 6px;
      font-size: 24px;
    }

    .password-wrap {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .toggle-password {
      min-width: 70px;
      background: rgba(255, 255, 255, 0.08);
      color: #d8e8ff;
      border: 1px solid rgba(168, 216, 255, 0.28);
    }

    @media (max-width: 860px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LoginPageComponent {
  readonly form;
  showPassword = false;
  busy = false;
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Enter username and password.';
      return;
    }

    this.errorMessage = '';
    this.busy = true;

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.busy = false;
        this.router.navigate(['/upcoming-events']);
      },
      error: (err) => {
        this.busy = false;
        this.errorMessage = err?.error?.message ?? 'Login failed.';
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
