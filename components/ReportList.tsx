import React, { useMemo, useState, useEffect } from 'react';
import type { FullReport } from '../types';

const IncidentIcon: React.FC<{ category: string }> = ({ category }) => {
  const getIcon = () => {
    switch (category.toLowerCase().trim()) {
      case 'speeding':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 009-9h-9V3a9 9 0 00-9 9h9v9zm0-9a4 4 0 11-8 0 4 4 0 018 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.89 8.11l-2.12 2.12" />
          </svg>
        );
      case 'illegal overtake':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4 4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13M5 11h14" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 16h14" />
          </svg>
        );
      case 'ignoring traffic signal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <circle cx="12" cy="8" r="1.2" fill="currentColor" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            <circle cx="12" cy="16" r="1.2" fill="currentColor" />
          </svg>
        );
      case 'distracted driving':
         return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default: // General Recklessness or other
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };
  
  return <div className="text-gray-500">{getIcon()}</div>;
};

const getSeverityBorderClass = (rating: number): string => {
  if (rating >= 4) return 'border-[--critical-red]';
  if (rating === 3) return 'border-orange-500';
  return 'border-gray-500';
};

const SeverityStars: React.FC<{ rating: number }> = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-[--critical-red]' : 'text-gray-600'}`}
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

const ReportItem: React.FC<{ report: FullReport }> = ({ report }) => {
    const formattedTime = new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const severityBorderClass = getSeverityBorderClass(report.severity_rating);

    return (
        <div className={`bg-[--tertiary-bg] p-4 rounded-xl space-y-3 border-l-4 ${severityBorderClass}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <IncidentIcon category={report.incident_category} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-[--primary-text]">{report.incident_category}</p>
                        <p className="text-sm text-[--secondary-text] mt-1 line-clamp-2">{report.summary}</p>
                    </div>
                </div>
                {report.licensePlate !== 'N/A' && (
                    <span className="bg-[--primary-bg] text-xs font-mono tracking-wider px-2.5 py-1 rounded-full text-[--secondary-text] whitespace-nowrap">
                        {report.licensePlate}
                    </span>
                )}
            </div>
            <div className="flex justify-between items-center pt-2 pl-9">
                <SeverityStars rating={report.severity_rating} />
                <p className="text-xs text-[--secondary-text]">{formattedTime}</p>
            </div>
        </div>
    );
};


interface GroupedReports {
  [key: string]: FullReport[];
}

export const ReportList: React.FC<{ reports: FullReport[] }> = ({ reports }) => {
  const groupedReports = useMemo(() => {
    return reports.reduce((acc: GroupedReports, report) => {
      const date = new Date(report.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(report);
      return acc;
    }, {});
  }, [reports]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedReports).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedReports]
  );
  
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sortedDates.length > 0) {
      const newExpandedState: Record<string, boolean> = {};
      newExpandedState[sortedDates[0]] = true; // Keep the most recent day expanded
      setExpandedDates(newExpandedState);
    }
  }, [sortedDates]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };


  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[--secondary-text] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-[--primary-text]">Watchlist is Empty</h2>
        <p className="text-[--secondary-text] mt-2 max-w-xs">No reports have been filed yet. Tap 'New Report' to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {sortedDates.map(date => {
        const isExpanded = !!expandedDates[date];
        const dateId = `report-list-${date.replace(/\s/g, '-')}`;
        return (
          <div key={date} className="border-b border-[--separator-color]/50 last:border-b-0 py-1">
            <button
              onClick={() => toggleDate(date)}
              className="w-full flex justify-between items-center text-left py-2 px-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[--critical-red] rounded-md"
              aria-expanded={isExpanded}
              aria-controls={dateId}
            >
              <h2 className="text-sm font-semibold text-[--primary-text]">{date}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-[--tertiary-bg] px-2 py-0.5 rounded-full text-[--secondary-text]">
                  {groupedReports[date].length}
                </span>
                <svg
                  className={`w-5 h-5 text-[--secondary-text] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
            {isExpanded && (
              <div id={dateId} className="space-y-3 pt-2 pb-2">
                {groupedReports[date].map(report => (
                  <ReportItem key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};