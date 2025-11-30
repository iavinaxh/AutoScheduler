export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: DayOfWeek;
  slots: TimeSlot[];
}

export interface InterviewerConfig {
  maxInterviewsPerWeek: number;
  availability: AvailabilityRule[];
}

export interface Booking {
  id: string;
  candidateName: string;
  candidateEmail: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  weekNumber: number;
}

export interface SlotOption {
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}