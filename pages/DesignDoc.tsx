import React from 'react';
import { FileText, Database, ShieldAlert, GitBranch, Layers } from 'lucide-react';

export const DesignDoc: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-bold text-slate-900">System Design Documentation</h1>
          <p className="mt-4 text-lg text-slate-600">
            This document outlines the architectural decisions for the Interview Scheduling System, focusing on a Java Spring Boot backend implementation strategy as requested.
          </p>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Database className="w-6 h-6 text-blue-600" />
            <h2>Database Schema (MySQL)</h2>
          </div>
          <div className="bg-slate-900 text-slate-50 p-6 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`
// Table: interviewers
CREATE TABLE interviewers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    max_weekly_interviews INT DEFAULT 5,
    version INT DEFAULT 0 -- Optimistic locking
);

// Table: availability_slots
// Stores recurring weekly availability
CREATE TABLE availability_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id BIGINT,
    day_of_week INT, -- 0-6 (Sun-Sat)
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (interviewer_id) REFERENCES interviewers(id)
);

// Table: bookings
// Stores actual booked slots
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id BIGINT,
    candidate_name VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slot (interviewer_id, start_time) -- DB constraint for double booking
);
            `}</pre>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <GitBranch className="w-6 h-6 text-purple-600" />
            <h2>API Flows & Endpoints</h2>
          </div>
          <div className="prose prose-slate max-w-none">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>GET /api/v1/availability</strong>
                <p className="text-sm text-slate-600 ml-2">Returns generated concrete time slots for the next 14 days based on <code>availability_rules</code> minus existing <code>bookings</code>. Uses cursor-based pagination for performance.</p>
              </li>
              <li>
                <strong>POST /api/v1/bookings</strong>
                <p className="text-sm text-slate-600 ml-2">Attempts to book a slot. Body: <code>{`{ slotTime: ISO8601, candidateName: string }`}</code>.</p>
              </li>
              <li>
                <strong>PUT /api/v1/config</strong>
                <p className="text-sm text-slate-600 ml-2">Updates interviewer settings (Max interviews/week, availability rules).</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h2>Race Condition Handling</h2>
          </div>
          <div className="bg-white border-l-4 border-red-500 p-4 shadow-sm">
            <h3 className="font-bold text-red-700">Strategy: Database Level Transaction & Unique Constraint</h3>
            <p className="mt-2 text-slate-700">
              To prevent double bookings when two candidates select the same slot simultaneously:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-700">
              <li>Use <code>@Transactional(isolation = Isolation.SERIALIZABLE)</code> on the booking service method (or slightly lower isolation with explicit locking).</li>
              <li>Rely on the unique constraint <code>UNIQUE KEY unique_slot (interviewer_id, start_time)</code> in MySQL. If a second insert occurs, the DB throws a <code>DataIntegrityViolationException</code>.</li>
              <li>Catch this exception in the Controller Advice and return a <code>409 Conflict</code> error to the client with a message "Slot already taken".</li>
            </ol>
          </div>
          <div className="bg-white border-l-4 border-orange-500 p-4 shadow-sm">
            <h3 className="font-bold text-orange-700">Handling Weekly Limits (Complex Race Condition)</h3>
            <p className="mt-2 text-slate-700">
              Ensuring <code>max_weekly_interviews</code> isn't exceeded requires a distributed lock or row lock on the <code>interviewers</code> table.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              <code>SELECT * FROM interviewers WHERE id = ? FOR UPDATE;</code><br/>
              This locks the interviewer row during the transaction, preventing concurrent bookings from verifying the count against a stale value.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Layers className="w-6 h-6 text-green-600" />
            <h2>Code Patterns & Clean Architecture</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 rounded bg-white">
              <h3 className="font-bold mb-2">Clean Architecture</h3>
              <ul className="text-sm space-y-1 text-slate-600">
                <li><strong>Controller Layer:</strong> Handles HTTP, DTO mapping.</li>
                <li><strong>Service Layer:</strong> Business logic (slot generation, validation).</li>
                <li><strong>Repository Layer:</strong> DB interaction (JPA/Hibernate).</li>
                <li><strong>Domain Models:</strong> Pure Java POJOs representing core entities.</li>
              </ul>
            </div>
            <div className="border border-slate-200 p-4 rounded bg-white">
              <h3 className="font-bold mb-2">Design Patterns</h3>
              <ul className="text-sm space-y-1 text-slate-600">
                <li><strong>Strategy Pattern:</strong> For different availability generation strategies.</li>
                <li><strong>Builder Pattern:</strong> For constructing complex Booking objects.</li>
                <li><strong>Facade Pattern:</strong> To simplify the BookingService interface for the controller.</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};