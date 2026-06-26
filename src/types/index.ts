export type UserRole = "organizer" | "exhibitor" | "visitor" | "admin";

export type EventStatus = "draft" | "published" | "active" | "ended";

export type LeadSource = "qr" | "manual";

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  interests: string[];
  avatar_url?: string | null;
  phone_number?: string | null;
  city?: string | null;
  bio?: string | null;
  org_name?: string | null;
  website?: string | null;
  kvkk_consent?: boolean;
  kvkk_consent_at?: string | null;
  created_at: string;
}

export interface ExpoEvent {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  cover_url: string | null;
  status: EventStatus;
  created_at: string;
  maps_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  youtube_url?: string | null;
  social_links?: { website?: string; instagram?: string; twitter?: string; linkedin?: string } | null;
  banner_url?: string | null;
}

export interface Hall {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export interface Booth {
  id: string;
  hall_id: string;
  code: string;
  exhibitor_id: string | null;
  created_at: string;
}

export interface Exhibitor {
  id: string;
  event_id: string;
  owner_id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  qr_token: string;
  created_at: string;
}

export interface Product {
  id: string;
  exhibitor_id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  exhibitor_id: string;
  visitor_id: string;
  source: LeadSource;
  score: number;
  note: string | null;
  created_at: string;
}

export interface Connection {
  id: string;
  from_user: string;
  to_user: string;
  status: ConnectionStatus;
  created_at: string;
}

export interface MatchScore {
  id: string;
  visitor_id: string;
  exhibitor_id: string;
  score: number;
  reason: string;
  created_at: string;
}
