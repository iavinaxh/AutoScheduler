import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MockApi } from '../services/mockApi';
import { SlotOption, Booking } from '../types';
import { Button } from '../components/ui/Button';
import { formatSlotDate, formatSlotTime } from '../utils/dateUtils';
import { ChevronRight, CheckCircle2, AlertCircle, Calendar, Filter, User, Bell, ArrowLeft, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'book' | 'my-bookings';

export const CandidateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('book');
  
  // Booking State
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  
  // Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  
  // UX State
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  // My Bookings State
  const [searchEmail, setSearchEmail] = useState('');
  const [myBookings, setMyBookings] = useState<Booking[] | null>(null);
  const [searching, setSearching] = useState(false);

  // --- Load Slots ---
  const loadSlots = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentCursor = reset ? null : cursor;
      const response = await MockApi.getAvailableSlots(currentCursor);
      
      setSlots(prev => reset ? response.data : [...prev, ...response.data]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    if (activeTab === 'book') loadSlots(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- Actions ---
  const handleBook = async () => {
    if (!selectedSlot || !candidateName.trim() || !candidateEmail.trim()) return;

    setBookingStatus('loading');
    setErrorMessage('');

    try {
      await MockApi.bookSlot(selectedSlot.startTime, candidateName, candidateEmail);
      setBookingStatus('success');
      loadSlots(true); // Refresh slots
    } catch (err: any) {
      setBookingStatus('error');
      setErrorMessage(err.message || 'Failed to book slot');
    }
  };

  const handleSearchBookings = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const bookings = await MockApi.getCandidateBookings(searchEmail);
      setMyBookings(bookings);
    } finally {
      setSearching(false);
    }
  };

  const handleReminder = (booking: Booking) => {
    alert(`Reminder set! We will send an email notification to ${booking.candidateEmail} 30 minutes before the interview on ${formatSlotDate(new Date(booking.startTime))}.`);
  };

  // --- Computed ---
  const filteredSlots = useMemo(() => {
    let filtered = slots;
    if (timeFilter === 'morning') {
      filtered = slots.filter(s => s.startTime.getHours() < 12);
    } else if (timeFilter === 'afternoon') {
      filtered = slots.filter(s => s.startTime.getHours() >= 12);
    }
    return filtered;
  }, [slots, timeFilter]);

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: SlotOption[] } = {};
    filteredSlots.forEach(slot => {
      const dateKey = format(slot.startTime, 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
    });
    return groups;
  }, [filteredSlots]);

  // --- Success View ---
  if (bookingStatus === 'success') {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-green-100 text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
        <p className="text-slate-600 mb-6">
          Your interview is scheduled for <span className="font-semibold">{selectedSlot && formatSlotDate(selectedSlot.startTime)}</span> at <span className="font-semibold">{selectedSlot && formatSlotTime(selectedSlot.startTime)}</span>.
          <br/>
          A confirmation has been sent to {candidateEmail}.
        </p>
        <div className="flex flex-col gap-3">
            <Button onClick={() => {
              setSearchEmail(candidateEmail);
              setActiveTab('my-bookings');
              setBookingStatus('idle');
              setSelectedSlot(null);
              // Trigger search automatically
              MockApi.getCandidateBookings(candidateEmail).then(setMyBookings);
            }} variant="secondary">View My Bookings</Button>
            
            <Button onClick={() => {
              setSelectedSlot(null);
              setBookingStatus('idle');
              setCandidateName('');
              setCandidateEmail('');
            }} variant="ghost">Book Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Navigation Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-8 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'book' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Calendar className="w-4 h-4" />
          Book Slot
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'my-bookings' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <User className="w-4 h-4" />
          My Profile & Bookings
        </button>
      </div>

      {activeTab === 'book' && (
        <>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Select an Interview Slot</h1>
              <p className="text-slate-600">Choose a time that works best for you.</p>
            </div>
            
            {/* Filter */}
            <div className="mt-4 md:mt-0 flex bg-white border border-slate-200 rounded-lg p-1">
               <button onClick={() => setTimeFilter('all')} className={`px-3 py-1 text-xs font-medium rounded ${timeFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>All</button>
               <button onClick={() => setTimeFilter('morning')} className={`px-3 py-1 text-xs font-medium rounded ${timeFilter === 'morning' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>Morning</button>
               <button onClick={() => setTimeFilter('afternoon')} className={`px-3 py-1 text-xs font-medium rounded ${timeFilter === 'afternoon' ? 'bg-orange-50 text-orange-700' : 'text-slate-500'}`}>Afternoon</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Slot List */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                  <div className="max-h-[600px] overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {Object.keys(groupedSlots).length === 0 && !loading && (
                      <div className="text-center py-12 text-slate-400">No slots available for this filter.</div>
                    )}

                    {(Object.entries(groupedSlots) as [string, SlotOption[]][]).map(([dateKey, groupSlots]) => (
                      <div key={dateKey}>
                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-2 mb-3 border-b border-slate-100 z-10 flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-blue-500" />
                           <h3 className="font-bold text-slate-800">{formatSlotDate(groupSlots[0].startTime)}</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {groupSlots.map((slot, idx) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={`${slot.startTime.toISOString()}-${idx}`}
                                onClick={() => setSelectedSlot(slot)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 text-blue-700' 
                                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="font-semibold text-lg">{formatSlotTime(slot.startTime)}</span>
                                <span className="text-xs opacity-75">to {formatSlotTime(slot.endTime)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {hasMore && (
                      <button 
                        onClick={() => loadSlots()}
                        disabled={loading}
                        className="w-full py-4 mt-4 text-sm text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div> : null}
                        {loading ? 'Loading more slots...' : 'Load next 14 days'}
                      </button>
                    )}
                  </div>
               </div>
            </div>

            {/* Booking Form (Sticky) */}
            <div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  Confirm Details
                </h3>
                
                {selectedSlot ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">Selected Time</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatSlotDate(selectedSlot.startTime)}
                      </div>
                      <div className="text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatSlotTime(selectedSlot.startTime)} - {formatSlotTime(selectedSlot.endTime)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="Ex: John Doe"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          placeholder="Ex: john@example.com"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {bookingStatus === 'error' && (
                      <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    <Button 
                      onClick={handleBook} 
                      isLoading={bookingStatus === 'loading'}
                      disabled={!candidateName.trim() || !candidateEmail.trim()}
                      className="w-full py-3 text-base"
                    >
                      Confirm Booking
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <Calendar className="w-8 h-8 mb-2 opacity-50" />
                    Select a time slot to continue
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'my-bookings' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <User className="w-6 h-6" />
              </div>
              My Bookings
            </h2>
            
            <div className="flex gap-2 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email to find bookings..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchBookings()}
                />
              </div>
              <Button onClick={handleSearchBookings} isLoading={searching}>Find</Button>
            </div>

            <div className="space-y-4">
              {myBookings === null && (
                 <div className="text-center py-10 text-slate-400">
                    Enter your email above to see your scheduled interviews.
                 </div>
              )}

              {myBookings !== null && myBookings.length === 0 && (
                 <div className="text-center py-10">
                    <p className="text-slate-900 font-medium">No bookings found</p>
                    <p className="text-slate-500 text-sm mt-1">No interviews found for {searchEmail}.</p>
                    <button onClick={() => setActiveTab('book')} className="text-blue-600 text-sm mt-4 hover:underline">Book an interview now</button>
                 </div>
              )}

              {myBookings && myBookings.map((booking) => (
                <div key={booking.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center w-16 h-16 shadow-sm">
                           <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(booking.startTime), 'MMM')}</span>
                           <span className="text-xl font-bold text-slate-900">{format(new Date(booking.startTime), 'dd')}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Interview with Recruiter</h3>
                          <div className="flex items-center gap-4 mt-1 text-slate-600 text-sm">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {formatSlotTime(new Date(booking.startTime))}</span>
                            <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-4 h-4"/> Confirmed</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReminder(booking)}
                        className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Set Reminder"
                      >
                        <Bell className="w-5 h-5" />
                      </button>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Booking ID: {booking.id}</span>
                      {/* Note: Cancellation typically handled by contacting recruiter or separate flow, but for demo we just show reminder */}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};