import { AvailabilityRule, Booking, DayOfWeek, InterviewerConfig, PaginatedResponse, SlotOption } from '../types';
import { addDays, startOfDay, addMinutes, format, parse, isSameDay, getWeek, isWithinInterval, isAfter } from 'date-fns';

// In-memory storage simulation
const STORAGE_KEY = 'autoschedule_db';

interface DB {
  config: InterviewerConfig;
  bookings: Booking[];
}

const DEFAULT_DB: DB = {
  config: {
    maxInterviewsPerWeek: 5,
    availability: [
      {
        id: '1',
        dayOfWeek: DayOfWeek.MONDAY,
        slots: [{ start: '09:00', end: '12:00' }]
      },
      {
        id: '2',
        dayOfWeek: DayOfWeek.WEDNESDAY,
        slots: [{ start: '14:00', end: '17:00' }]
      }
    ]
  },
  bookings: []
};

const getDB = (): DB => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_DB;
};

const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const SIMULATED_DELAY = 600;

export const MockApi = {
  getInterviewerConfig: async (): Promise<InterviewerConfig> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return getDB().config;
  },

  updateInterviewerConfig: async (config: InterviewerConfig): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const db = getDB();
    db.config = config;
    saveDB(db);
  },

  // Simulating sophisticated slot generation logic
  getAvailableSlots: async (cursor: string | null, limit: number = 20): Promise<PaginatedResponse<SlotOption>> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const db = getDB();
    const now = new Date();
    const startDate = cursor ? new Date(cursor) : startOfDay(now);
    const endDate = addDays(startOfDay(now), 14); // Next 2 weeks window

    let allSlots: SlotOption[] = [];
    let currentDay = startDate;

    // Generate potential slots based on rules
    while (currentDay <= endDate) {
      const dayOfWeek = currentDay.getDay();
      const weekNum = getWeek(currentDay);
      
      // Check weekly cap
      const bookingsThisWeek = db.bookings.filter(b => b.weekNumber === weekNum).length;
      if (bookingsThisWeek >= db.config.maxInterviewsPerWeek) {
        currentDay = addDays(currentDay, 1);
        continue; // Skip this day/week if cap reached
      }

      const rule = db.config.availability.find(r => r.dayOfWeek === dayOfWeek);
      if (rule) {
        for (const timeRange of rule.slots) {
          let slotStart = parse(timeRange.start, 'HH:mm', currentDay);
          const rangeEnd = parse(timeRange.end, 'HH:mm', currentDay);
          
          // Create 1 hour slots
          while (isAfter(rangeEnd, slotStart) || rangeEnd.getTime() === slotStart.getTime()) {
             const slotEnd = addMinutes(slotStart, 60);
             if (isAfter(slotEnd, rangeEnd)) break;

             // Check if already booked
             const isBooked = db.bookings.some(b => 
                isSameDay(new Date(b.startTime), slotStart) && 
                new Date(b.startTime).getTime() === slotStart.getTime()
             );

             // Only add future slots
             if (isAfter(slotStart, now) && !isBooked) {
                allSlots.push({
                  startTime: slotStart,
                  endTime: slotEnd,
                  isBooked: false
                });
             }
             
             slotStart = slotEnd; 
          }
        }
      }
      currentDay = addDays(currentDay, 1);
    }

    // Pagination logic
    const paginatedData = allSlots.slice(0, limit);
    const nextItem = allSlots[limit];
    const nextCursor = nextItem ? nextItem.startTime.toISOString() : null;

    return {
      data: paginatedData,
      nextCursor,
      hasMore: !!nextItem
    };
  },

  getBookings: async (): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return getDB().bookings;
  },

  getCandidateBookings: async (email: string): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    return getDB().bookings.filter(b => b.candidateEmail.toLowerCase() === email.toLowerCase());
  },

  bookSlot: async (slotStart: Date, candidateName: string, candidateEmail: string): Promise<Booking> => {
    // Simulate network race condition
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY + Math.random() * 500));
    
    const db = getDB();
    
    // 1. Race Condition Check (Optimistic Locking simulation)
    const isTaken = db.bookings.some(b => new Date(b.startTime).getTime() === slotStart.getTime());
    if (isTaken) {
      throw new Error("Race Condition Detected: Slot was just taken by another user.");
    }

    // 2. Double check weekly limits (in case someone else filled the quota moments ago)
    const weekNum = getWeek(slotStart);
    const bookingsThisWeek = db.bookings.filter(b => b.weekNumber === weekNum).length;
    if (bookingsThisWeek >= db.config.maxInterviewsPerWeek) {
      throw new Error("Weekly limit reached. Please choose a slot in a different week.");
    }

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      candidateName,
      candidateEmail,
      startTime: slotStart.toISOString(),
      endTime: addMinutes(slotStart, 60).toISOString(),
      weekNumber: weekNum
    };

    db.bookings.push(newBooking);
    saveDB(db);
    return newBooking;
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    const db = getDB();
    db.bookings = db.bookings.filter(b => b.id !== bookingId);
    saveDB(db);
  },

  resetDB: async () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};