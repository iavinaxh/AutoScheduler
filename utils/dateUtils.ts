import { format } from 'date-fns';

export const formatSlotDate = (date: Date) => format(date, 'EEEE, MMM do');
export const formatSlotTime = (date: Date) => format(date, 'h:mm a');
export const formatFullDateTime = (date: Date) => format(date, 'PPpp');
