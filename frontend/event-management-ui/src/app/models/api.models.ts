export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  profileName: string;
  username: string;
  age?: number | null;
  email: string;
  contact: string;
  password: string;
  role: 'Attendee';
}

export interface CreateOrganizerRequest {
  profileName: string;
  username: string;
  age?: number | null;
  email: string;
  contact: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  profileName: string;
  username: string;
  role: string;
}

export interface AuthProfile {
  userId: number;
  profileName: string;
  username: string;
  age?: number | null;
  email: string;
  contact: string;
  role: string;
}

export interface UpdateProfileRequest {
  profileName?: string;
  username?: string;
  age?: number | null;
  email?: string;
  contact?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface EventItem {
  eventId: number;
  eventName: string;
  description: string;
  eventDate: string;
  vacancy: number;
  remainingVacancy: number;
  isCancelled: boolean;
  isBooked: boolean;
  bookingId?: number;
  createdByUserId: number;
  createdByUsername: string;
  createdByProfileName: string;
  approvalStatus: string;
  approvalRequestedAtUtc?: string;
  approvedAtUtc?: string;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isPendingDelete: boolean;
}

export interface BookingItem {
  bookingId: number;
  userId: number;
  eventId: number;
  event?: EventItem;
}

export interface EventBookingItem {
  bookingId: number;
  userId: number;
  username: string;
  profileName: string;
  email?: string;
  contact?: string;
}

export interface BookingSummary {
  totalBookings: number;
  distinctEvents: number;
}

export interface EventUpsertRequest {
  eventName: string;
  description: string;
  eventDate: string;
  vacancy: number;
}

export interface UpdateUserRoleRequest {
  role: 'Attendee' | 'Organizer' | 'Admin';
}
