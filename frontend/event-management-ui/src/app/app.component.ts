import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthProfile } from './models/api.models';
import { AuthService } from './services/auth.service';
import { ApiStatusService } from './services/api-status.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  user: AuthProfile | null = null;
  showUserMenu = false;
  isApiDown = false;

  constructor(
    private readonly authService: AuthService,
    private readonly apiStatus: ApiStatusService
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.apiStatus.isDown$.subscribe((down) => {
      this.isApiDown = down;
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  roleEmoji(role: string | undefined): string {
    switch (role) {
      case 'Admin':
        return '👑';
      case 'Organizer':
        return '🛠️';
      default:
        return '🎟️';
    }
  }

  displayName(): string {
    if (!this.user) {
      return '';
    }

    return this.user.profileName || this.user.username;
  }

  logout(): void {
    this.showUserMenu = false;
    this.authService.logout();
  }
}
