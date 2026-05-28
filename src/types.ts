export type AppointmentStatus = 'geplant' | 'verschoben' | 'abgesagt' | 'abgeschlossen' | 'no_show';
export type StaffMember = 'Sofia' | 'Mateo' | 'Elena' | 'Luca' | 'Isabella' | 'Beliebig';

export interface Appointment {
  id: string;
  type: 'appointment';
  source: 'voice-agent' | 'manual-demo' | 'api';
  customerName: string;
  phone: string;
  service: string;
  staff: StaffMember;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string; // ISO DateTime
  updatedAt: string; // ISO DateTime
  cancellationReason: string | null;
  previousAppointmentId: string | null;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceText: string;
}

export interface SalonConfig {
  name: string;
  location: string;
  demoMode: boolean;
  geminiModel: string;
  liveModel: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: any[]; // Format compatible with @google/genai
}
