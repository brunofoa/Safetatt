
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
  LOYALTY = 'LOYALTY'
}

export type Role = 'MASTER' | 'ARTIST' | 'CLIENT';

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
  memberCount: number;
  loyaltyConfig?: LoyaltyConfig;
  whatsapp_instance_name?: string;
  whatsapp_status?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  totalSpent: number;
  avatar: string;
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

export interface Appointment {
  id: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  time: string;
  artist: string;
  title: string;
  description: string;
  status: 'Confirmado' | 'Pendente' | 'Finalizado' | 'Ausente' | 'Cancelado';
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
