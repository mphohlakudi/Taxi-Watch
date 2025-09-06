
import React from 'react';
import type { GeminiSummary } from '../types';

interface SubmissionResultProps {
  summary: GeminiSummary;
  onReset: () => void;
}

const SeverityStars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < rating ? 'text-[--critical-red]' : 'text-gray-600'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export const SubmissionResult: React.FC<SubmissionResultProps> = ({ summary, onReset }) => {
  return (
    <div className="text-center animate-fade-in">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[--tertiary-bg] mb-4">
        <svg className="h-8 w-8 text-[--critical-red]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[--primary-text]">Report Submitted</h2>
      <p className="text-[--secondary-text] mt-2 mb-8">Thank you for helping make our roads safer. Here is the AI-generated summary of the incident.</p>
      
      <div className="bg-[--tertiary-bg] p-4 rounded-xl text-left space-y-5">
        <div>
          <h3 className="text-sm font-medium text-[--secondary-text]">Incident Category</h3>
          <p className="text-base font-semibold text-[--primary-text]">{summary.incident_category}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[--secondary-text]">Summary</h3>
          <p className="text-base text-[--primary-text]">{summary.summary}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[--secondary-text]">Severity Rating</h3>
          <SeverityStars rating={summary.severity_rating} />
        </div>
         <div>
          <h3 className="text-sm font-medium text-[--secondary-text]">Vehicle Description</h3>
          <p className="text-base text-[--primary-text]">{summary.vehicle_description}</p>
        </div>
         <div>
          <h3 className="text-sm font-medium text-[--secondary-text]">Location</h3>
          <p className="text-base text-[--primary-text]">{summary.location_guess}</p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-base font-semibold text-white bg-[--critical-red] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--secondary-bg] focus:ring-[--critical-red] transition"
      >
        View Watchlist
      </button>
    </div>
  );
};