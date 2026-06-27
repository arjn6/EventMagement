import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass && confirm && pass !== confirm ? { mismatch: true } : null;
  };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="auth-hero">
        <div class="hero-icon">🎯</div>
        <h2>Join EventHub</h2>
        <p>Create your account to discover and book amazing events.</p>
        <ul class="hero-perks">
          <li>✅ Browse upcoming events</li>
          <li>✅ Book seats instantly</li>
          <li>✅ Manage your profile</li>
        </ul>
      </div>

      <div class="auth-card">
        <h3>Create Account</h3>
        <p class="hint">Self-registration creates attendee accounts only.</p>

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
        <p class="success" *ngIf="successMessage">{{ successMessage }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="field-group">
            <label>Profile Name <span class="req">*</span></label>
            <input type="text" formControlName="profileName"
                   [class.input-error]="touched('profileName') && form.get('profileName')?.invalid"
                   placeholder="Your display name" />
            <span class="field-error" *ngIf="touched('profileName') && form.get('profileName')?.hasError('required')">
              Profile name is required.
            </span>
          </div>

          <div class="field-group">
            <label>Username <span class="req">*</span></label>
            <input type="text" formControlName="username"
                   [class.input-error]="touched('username') && form.get('username')?.invalid"
                   placeholder="Unique username" />
            <span class="field-error" *ngIf="touched('username') && form.get('username')?.hasError('required')">
              Username is required.
            </span>
            <span class="field-error" *ngIf="touched('username') && form.get('username')?.hasError('minlength')">
              Username must be at least 3 characters.
            </span>
          </div>

          <div class="row two-col">
            <div class="field-group">
              <label>Age</label>
              <input type="number" min="1" max="120" formControlName="age"
                     [class.input-error]="touched('age') && form.get('age')?.invalid"
                     placeholder="Optional" />
              <span class="field-error" *ngIf="touched('age') && form.get('age')?.hasError('min')">Age must be at least 1.</span>
              <span class="field-error" *ngIf="touched('age') && form.get('age')?.hasError('max')">Age must be 120 or less.</span>
            </div>
            <div class="field-group">
              <label>Contact</label>
              <input type="text" formControlName="contact" placeholder="Phone or social" />
            </div>
          </div>

          <div class="field-group">
            <label>Email</label>
            <input type="email" formControlName="email"
                   [class.input-error]="touched('email') && form.get('email')?.invalid"
                   placeholder="your@email.com" />
            <span class="field-error" *ngIf="touched('email') && form.get('email')?.hasError('email')">
              Enter a valid email address.
            </span>
          </div>

          <div class="field-group">
            <label>Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input [type]="showPassword ? 'text' : 'password'" formControlName="password"
                     [class.input-error]="touched('password') && form.get('password')?.invalid"
                     placeholder="Min. 6 characters" />
              <button type="button" class="eye-btn" (click)="showPassword = !showPassword" tabindex="-1">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="field-error" *ngIf="touched('password') && form.get('password')?.hasError('required')">
              Password is required.
            </span>
            <span class="field-error" *ngIf="touched('password') && form.get('password')?.hasError('minlength')">
              Password must be at least 6 characters.
            </span>
          </div>

          <div class="field-group">
            <label>Confirm Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input [type]="showConfirm ? 'text' : 'password'" formControlName="confirmPassword"
                     [class.input-error]="touched('confirmPassword') && (form.get('confirmPassword')?.invalid || form.hasError('mismatch'))"
                     placeholder="Re-enter your password" />
              <button type="button" class="eye-btn" (click)="showConfirm = !showConfirm" tabindex="-1">
                {{ showConfirm ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="field-error" *ngIf="touched('confirmPassword') && form.get('confirmPassword')?.hasError('required')">
              Please confirm your password.
            </span>
            <span class="field-error" *ngIf="touched('confirmPassword') && form.hasError('mismatch') && !form.get('confirmPassword')?.hasError('required')">
              Passwords do not match.
            </span>
          </div>

          <button type="submit" [disabled]="busy" class="submit-btn">
            {{ busy ? 'Creating Account...' : '🚀 Create Account' }}
          </button>
        </form>

        <p class="login-link">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </section>
  `,
  styles: [`
    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 24px;
      align-items: start;
    }

    .auth-hero {
      border-radius: 18px;
      border: 1px solid rgba(168, 216, 255, 0.2);
      padding: 32px 28px;
      background: linear-gradient(160deg, rgba(8, 22, 42, 0.92), rgba(4, 14, 30, 0.88));
      position: sticky;
      top: 90px;
    }

    .hero-icon {
      font-size: 48px;
      margin-bottom: 14px;
    }

    .auth-hero h2 {
      margin: 0 0 10px;
      font-size: 30px;
      font-weight: 800;
      background: linear-gradient(135deg, #1f8fff, #21c57a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-hero p {
      margin: 0 0 20px;
      color: #b8d2ed;
      font-size: 15px;
      line-height: 1.6;
    }

    .hero-perks {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .hero-perks li {
      color: #a8c6e0;
      font-size: 14px;
      font-weight: 600;
    }

    .auth-card {
      border-radius: 18px;
      border: 1px solid rgba(168, 216, 255, 0.22);
      padding: 28px 26px;
      background: linear-gradient(160deg, rgba(8, 22, 42, 0.95), rgba(4, 14, 30, 0.9));
    }

    .auth-card h3 {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 800;
      color: #ecf3ff;
    }

    /* Fields */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 14px;
    }

    .field-group label {
      font-size: 13px;
      font-weight: 700;
      color: #c0d8f0;
    }

    .req {
      color: #ff7b7b;
      margin-left: 2px;
    }

    .pass-wrap {
      position: relative;
      display: flex;
    }

    .pass-wrap input {
      flex: 1;
      padding-right: 44px;
    }

    .eye-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      line-height: 1;
    }

    .input-error {
      border-color: rgba(255, 120, 120, 0.6) !important;
      box-shadow: 0 0 0 3px rgba(255, 80, 80, 0.1) !important;
    }

    .field-error {
      font-size: 11px;
      color: #ff9d9d;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .field-error::before {
      content: '⚠';
      font-size: 10px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 0;
    }

    .submit-btn {
      width: 100%;
      margin-top: 6px;
      padding: 13px;
      border-radius: 10px;
      border: 0;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      background: linear-gradient(135deg, #21c57a, #1f8fff);
      color: #02152b;
      box-shadow: 0 4px 14px rgba(33, 197, 122, 0.25);
      transition: all 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(33, 197, 122, 0.35);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-link {
      text-align: center;
      margin: 14px 0 0;
      font-size: 13px;
      color: #8fa6c6;
    }

    .login-link a {
      color: #21c57a;
      font-weight: 700;
      text-decoration: none;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 860px) {
      .auth-shell { grid-template-columns: 1fr; }
      .auth-hero { position: static; }
      .two-col { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterPageComponent {
  readonly form;
  busy = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      profileName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      age: [null as number | null, [Validators.min(1), Validators.max(120)]],
      email: ['', [Validators.email]],
      contact: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordsMatchValidator() });
  }

  touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.form.getRawValue();
    const payload = {
      profileName: raw.profileName.trim(),
      username: raw.username.trim(),
      age: raw.age,
      email: raw.email.trim(),
      contact: raw.contact.trim(),
      password: raw.password,
      role: 'Attendee' as const
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.busy = false;
        this.successMessage = 'Account created! Redirecting...';
        setTimeout(() => this.router.navigate(['/upcoming-events']), 900);
      },
      error: (err) => {
        this.busy = false;
        this.errorMessage = err?.error?.message ?? 'Registration failed.';
      }
    });
  }
}
