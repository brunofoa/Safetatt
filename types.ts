
export enum Screen {
  LOGIN = 'LOGIN',
  STUDIO_SELECTION = 'STUDIO_SELECTION',
  DASHBOARD = 'DASHBOARD',
  CLIENTS = 'CLIENTS',
  APPOINTMENTS = 'APPOINTMENTS',
  SETTINGS = 'SETTINGS',
  NEW_APPOINTMENT = 'NEW_APPOINTMENT',
  CLIENT_PROFILE = 'CLIENT_PROFILE',
  AGENDA = 'AGENDA',
  // Client Area Screens
  CLIENT_HOME = 'CLIENT_HOME',
  CLIENT_HISTORY = 'CLIENT_HISTORY',
  CLIENT_FINANCIAL = 'CLIENT_FINANCIAL',
  CLIENT_CARE = 'CLIENT_CARE',
  MARKETING = 'MARKETING',
  LOYALTY = 'LOYALTY',
  // Admin Screens
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_STUDIOS = 'ADMIN_STUDIOS',
  ADMIN_NEW_STUDIO = 'ADMIN_NEW_STUDIO'
}

export type Role = 'MASTER' | 'ARTIST' | 'PIERCER' | 'RECEPTIONIST' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | string; // Allowing string for now to avoid breaking existing mocks immediately
  avatar: string;
}

export interface Studio {
  id: string;
  name: string;
  owner: string;
  role: Role;
  logo: string;
  logo_url?: string; // Mapped from DB
  memberCount: number;
  loyaltyConfig?: LoyaltyConfig;
  whatsapp_instance_name?: string;
  whatsapp_instance_id?: string;
  whatsapp_token?: string;
  whatsapp_status?: string;
  slug?: string;
  cnpj?: string;
  zip_code?: string;
  address_street?: string;
  address_number?: string;
  city?: string;
  state?: string;
  contact_phone?: string;
  contact_email?: string;
  settings_anamnesis?: string[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  totalSpent: number;
  avatar_url?: string;
  birthDate?: string;
  cpf?: string;
  rg?: string;
  profession?: string;
  instagram?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  address?: string;
}

// Enum matching DB 'service_type'
export enum ServiceType {
  TATTOO = 'TATTOO',
  PIERCING = 'PIERCING'
}

export interface Appointment {
  id: string;
  clientName: string;
  clientAvatar: string;
  date: string; // ISO String for start_time
  start_time: string; // Keep both for safety/refactor
  end_time: string;

  artist: string; // Mapped from 'professional' or joined artist table if needed, for now schema has 'artist_id' and 'professional' text? Schema said 'professional' text column AND 'artist_id' uuid.

  title: string;
  description: string; // Mapped from 'observations'
  status: 'Confirmado' | 'Pendente' | 'Finalizado' | 'Ausente' | 'Cancelado';

  // Real DB Fields
  clientId?: string;
  studio_id?: string;
  artist_id?: string;
  service_type?: ServiceType | string;
  price?: number;
  payment_status?: string;
  body_location?: string;
  size?: string;
  technical_details?: any; // jsonb
  session_number?: number;
  consent_signature_url?: string;
  signature?: string; // New field added as per instruction

  // Helpers
  startTime?: string; // alias to start_time
  endTime?: string; // alias to end_time
  time?: string; // Formatted time string (e.g. "10:00 - 12:00")
  artistColor?: string; // From profile display_color

  photos?: string[];
  tattooImage?: string | null;
  value?: number | string;
  dateObj?: Date;
  bodyPart?: string; // Alias for body_location often used in UI

  // New Fields
  art_color?: string;
}

export interface Session {
  id: string;
  studio_id?: string;
  client_id?: string;
  professional_id?: string;
  appointment_id?: string | null;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'canceled';
  title: string;
  description?: string;
  service_type: 'tattoo' | 'piercing';
  body_location?: string;
  art_color?: string;
  size?: string;
  price?: number;
  photos_url?: string[];
  consent_signature_url?: string;
  performed_date?: string;
  created_at?: string;

  // Joins
  clientName?: string;
  artistName?: string;
  artistColor?: string;
  clients?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    cpf?: string;
    phone?: string;
    email?: string;
  };
  profiles?: {
    id: string;
    full_name: string;
    display_color?: string;
  };
}

export type LoyaltyRewardType = 'PERCENTAGE' | 'FIXED';

export interface LoyaltyConfig {
  isActive: boolean;
  rewardType: LoyaltyRewardType;
  rewardValue: number; // % or Fixed Amount
  minSpentToUse: number;
  validityDays: number;
  maxUsageLimit: number; // Max amount or % that can be used per transaction
}

export type LoyaltyTransactionType = 'CREDIT' | 'DEBIT' | 'EXPIRED' | 'MANUAL_ADJUST';

export interface LoyaltyTransaction {
  id: string;
  studio_id: string;
  client_id: string;
  appointment_id?: string;
  type: LoyaltyTransactionType;
  amount: number;
  description?: string;
  expires_at?: string;
  created_at: string;
}
