import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { eventManagerGuard } from './guards/event-manager.guard';
import { attendeeGuard } from './guards/attendee.guard';
import { LoginPageComponent } from './pages/login.page';
import { RegisterPageComponent } from './pages/register.page';
import { BookingsPageComponent } from './pages/bookings.page';
import { AdminEventsPageComponent } from './pages/admin-events.page';
import { AdminUsersPageComponent } from './pages/admin-users.page';
import { UpcomingEventsPageComponent } from './pages/upcoming-events.page';
import { ProfilePageComponent } from './pages/profile.page';
import { CreateEventPageComponent } from './pages/create-event.page';
import { RequestsPageComponent } from './pages/requests.page';
import { EventBookingsPageComponent } from './pages/event-bookings.page';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'upcoming-events' },
	{ path: 'upcoming-events', component: UpcomingEventsPageComponent },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'register', component: RegisterPageComponent },
	{ path: 'events', redirectTo: 'upcoming-events' },
	{ path: 'bookings', component: BookingsPageComponent, canActivate: [authGuard, attendeeGuard] },
	{ path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
	{ path: 'create-event', component: CreateEventPageComponent, canActivate: [authGuard, eventManagerGuard] },
	{ path: 'manage-events', component: AdminEventsPageComponent, canActivate: [authGuard, eventManagerGuard] },
	{ path: 'event-bookings/:id', component: EventBookingsPageComponent, canActivate: [authGuard, eventManagerGuard] },
	{ path: 'requests', component: RequestsPageComponent, canActivate: [authGuard, adminGuard] },
	{ path: 'admin/events', redirectTo: 'manage-events' },
	{ path: 'admin/users', component: AdminUsersPageComponent, canActivate: [authGuard, adminGuard] },
	{ path: '**', redirectTo: 'upcoming-events' }
];
