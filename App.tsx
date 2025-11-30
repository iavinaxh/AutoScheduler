import React, { useState } from 'react';
import { InterviewerDashboard } from './pages/InterviewerDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { DesignDoc } from './pages/DesignDoc';
import { Users, CalendarCheck, BookOpen, RotateCcw } from 'lucide-react';
import { MockApi } from './services/mockApi';

type View = 'landing' | 'interviewer' | 'candidate' | 'docs';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');

  const renderView = () => {
    switch (view) {
      case 'interviewer':
        return <InterviewerDashboard />;
      case 'candidate':
        return <CandidateDashboard />;
      case 'docs':
        return <DesignDoc />;
      default:
        return (
          <div className="max-w-4xl mx-auto py-16 px-4 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
              AutoSchedule
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
              A high-performance interview scheduling system simulator. 
              Designed with Java/Spring architectural principles, implemented in React.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => setView('interviewer')}
                className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">I am an Interviewer</h3>
                <p className="text-sm text-slate-500 mt-2">Set availability, max capacity, and view bookings.</p>
              </button>

              <button 
                onClick={() => setView('candidate')}
                className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <CalendarCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">I am a Candidate</h3>
                <p className="text-sm text-slate-500 mt-2">View generated slots, book time, and handle race conditions.</p>
              </button>

              <button 
                onClick={() => setView('docs')}
                className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all group"
              >
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">System Design</h3>
                <p className="text-sm text-slate-500 mt-2">Review the API flows, DB schema, and architectural decisions.</p>
              </button>
            </div>

            <div className="mt-12">
               <button onClick={() => MockApi.resetDB()} className="text-xs text-slate-400 hover:text-red-500 flex items-center justify-center w-full gap-1">
                 <RotateCcw className="w-3 h-3" /> Reset Database Simulator
               </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('landing')}>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AutoSchedule
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {view !== 'landing' && (
                <button 
                  onClick={() => setView('landing')}
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  Home
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>
        {renderView()}
      </main>
    </div>
  );
};

export default App;