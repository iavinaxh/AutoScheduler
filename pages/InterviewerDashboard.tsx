import React, { useEffect, useState } from 'react';
import { MockApi } from '../services/mockApi';
import { InterviewerConfig, Booking, DayOfWeek } from '../types';
import { Button } from '../components/ui/Button';
import { Calendar, Save, Trash2, Clock, Users, Settings, Mail, List } from 'lucide-react';
import { formatFullDateTime } from '../utils/dateUtils';

const DAYS = [
  { value: DayOfWeek.MONDAY, label: 'Monday' },
  { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
  { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
  { value: DayOfWeek.THURSDAY, label: 'Thursday' },
  { value: DayOfWeek.FRIDAY, label: 'Friday' },
];

export const InterviewerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [config, setConfig] = useState<InterviewerConfig | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      MockApi.getInterviewerConfig(),
      MockApi.getBookings()
    ]).then(([conf, books]) => {
      setConfig(conf);
      setBookings(books);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    await MockApi.updateInterviewerConfig(config);
    setSaving(false);
    alert('Availability updated successfully!');
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;
    await MockApi.cancelBooking(id);
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  if (loading || !config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interviewer Dashboard</h1>
          <p className="text-slate-600">Overview of your upcoming schedule and configuration.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <List className="w-4 h-4" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Weekly Cap</p>
            <p className="text-2xl font-bold text-slate-900">{config.maxInterviewsPerWeek} <span className="text-xs font-normal text-slate-400">/ week</span></p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Next Interview</p>
            <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
              {bookings.length > 0 
                ? formatFullDateTime(new Date(Math.min(...bookings.map(b => new Date(b.startTime).getTime()))))
                : 'None scheduled'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'bookings' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Scheduled Interviews</h2>
          </div>
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No interviews scheduled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Candidate</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {booking.candidateName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {booking.candidateEmail || 'No email provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatFullDateTime(new Date(booking.startTime))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-xs border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Settings Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-slate-800 font-semibold">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h2>Configuration</h2>
                </div>
                <Button onClick={handleSave} isLoading={saving} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>

              <div className="space-y-6">
                <div className="pb-6 border-b border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weekly Interview Limit</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" 
                      max="40"
                      className="border border-slate-300 rounded px-3 py-2 w-24"
                      value={config.maxInterviewsPerWeek}
                      onChange={(e) => setConfig({ ...config, maxInterviewsPerWeek: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-sm text-slate-500">interviews per week maximum</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">Recurring Availability</label>
                  <div className="space-y-4">
                    {DAYS.map((day) => {
                      const dayRule = config.availability.find(r => r.dayOfWeek === day.value);
                      const hasRule = !!dayRule;

                      return (
                        <div key={day.value} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                          <div className="w-24 font-medium text-slate-700">{day.label}</div>
                          <div className="flex-1">
                            {hasRule ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                {dayRule.slots.map((slot, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded border border-slate-200">
                                    <input 
                                      type="time" 
                                      value={slot.start} 
                                      onChange={(e) => {
                                        const newAvail = [...config.availability];
                                        const ruleIdx = newAvail.findIndex(r => r.dayOfWeek === day.value);
                                        newAvail[ruleIdx].slots[idx].start = e.target.value;
                                        setConfig({ ...config, availability: newAvail });
                                      }}
                                      className="bg-transparent text-sm w-24"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input 
                                      type="time" 
                                      value={slot.end} 
                                      onChange={(e) => {
                                        const newAvail = [...config.availability];
                                        const ruleIdx = newAvail.findIndex(r => r.dayOfWeek === day.value);
                                        newAvail[ruleIdx].slots[idx].end = e.target.value;
                                        setConfig({ ...config, availability: newAvail });
                                      }}
                                      className="bg-transparent text-sm w-24"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 italic">Unavailable</span>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              if (hasRule) {
                                setConfig({ 
                                  ...config, 
                                  availability: config.availability.filter(r => r.dayOfWeek !== day.value) 
                                });
                              } else {
                                setConfig({
                                  ...config,
                                  availability: [...config.availability, {
                                    id: Math.random().toString(),
                                    dayOfWeek: day.value,
                                    slots: [{ start: '09:00', end: '17:00' }]
                                  }]
                                });
                              }
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium uppercase tracking-wider ${hasRule ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                          >
                            {hasRule ? 'Off' : 'On'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Help Guide</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Configure your weekly availability here. These rules are used to generate specific time slots for candidates.
                </p>
                <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                  <li>Set your max interviews per week to avoid burnout.</li>
                  <li>Time slots are generated in 1-hour increments.</li>
                  <li>Changes affect future slot generation immediately.</li>
                </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};