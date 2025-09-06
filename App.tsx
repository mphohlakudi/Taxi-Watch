import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ReportForm } from './components/ReportForm';
import { LoadingScreen } from './components/LoadingScreen';
import { SubmissionResult } from './components/SubmissionResult';
import { Header } from './components/Header';
import { ReportList } from './components/ReportList';
import { AppNavigator } from './components/AppNavigator';
import { Settings } from './components/Settings';
import { PrivacyModal } from './components/PrivacyModal';
import { analyzeReport, redactPII } from './services/geminiService';
import type { ReportData, GeminiSummary, FullReport, RedactionResult } from './types';
import { AppView, ProcessState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.FORM);
  const [processState, setProcessState] = useState<ProcessState>(ProcessState.IDLE);
  const [summary, setSummary] = useState<GeminiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<FullReport[]>([]);

  // State for privacy flow
  const [originalReportData, setOriginalReportData] = useState<ReportData | null>(null);
  const [redactionResult, setRedactionResult] = useState<RedactionResult | null>(null);

  // State for hidden settings access
  const [reportTapCount, setReportTapCount] = useState(0);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedReports = localStorage.getItem('taxiWatchReports');
      if (storedReports) {
        setReports(JSON.parse(storedReports));
      }
    } catch (e) {
      console.error("Failed to load reports from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('taxiWatchReports', JSON.stringify(reports));
    } catch (e) {
      console.error("Failed to save reports to localStorage", e);
    }
  }, [reports]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(async (data: ReportData) => {
    setProcessState(ProcessState.REDACTING);
    setError(null);
    setOriginalReportData(data); // Store original data

    try {
      const result = await redactPII({
        description: data.description,
        location: data.location,
      });
      setRedactionResult(result);
      setProcessState(ProcessState.AWAITING_CONFIRMATION);
    } catch (err) {
      console.error(err);
      setError('Sorry, we could not perform the privacy check. Please try again.');
      setProcessState(ProcessState.IDLE);
    }
  }, []);

  const handleConfirmRedaction = useCallback(async () => {
    if (!originalReportData || !redactionResult) return;

    setProcessState(ProcessState.ANALYZING);
    setError(null);

    const sanitizedData: ReportData = {
        ...originalReportData,
        description: redactionResult.sanitized_description,
        location: redactionResult.sanitized_location,
    };
    
    try {
        const result = await analyzeReport(sanitizedData);
        setSummary(result);

        const newReport: FullReport = {
            ...result,
            id: new Date().toISOString() + Math.random(),
            licensePlate: originalReportData.licensePlate?.trim() ? originalReportData.licensePlate.trim().toUpperCase() : 'N/A',
            timestamp: new Date().toISOString(),
        };
        setReports(prevReports => [newReport, ...prevReports]);

        setProcessState(ProcessState.RESULT);
    } catch (err) {
        console.error(err);
        setError('Sorry, we could not process your report. Please try again.');
        setProcessState(ProcessState.IDLE);
    } finally {
        setOriginalReportData(null);
        setRedactionResult(null);
    }
  }, [originalReportData, redactionResult]);

  const handleCancelRedaction = useCallback(() => {
    setProcessState(ProcessState.IDLE);
    setOriginalReportData(null);
    setRedactionResult(null);
  }, []);

  const handleResetAfterSubmission = useCallback(() => {
    setProcessState(ProcessState.IDLE);
    setView(AppView.LIST);
    setSummary(null);
    setError(null);
  }, []);
  
  const handleNavigate = useCallback((newView: AppView) => {
    setError(null);
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    if (newView === AppView.FORM) {
      const newCount = reportTapCount + 1;
      setReportTapCount(newCount);

      if (newCount >= 7) {
        setView(AppView.SETTINGS);
        setReportTapCount(0);
      } else {
        setView(AppView.FORM);
        tapTimeoutRef.current = window.setTimeout(() => {
          setReportTapCount(0);
        }, 1500);
      }
    } else {
      setReportTapCount(0);
      setView(newView);
    }
  }, [reportTapCount]);

  const renderContent = () => {
    if (processState === ProcessState.REDACTING) {
      return <LoadingScreen stage="REDACTING" />;
    }
    if (processState === ProcessState.ANALYZING) {
      return <LoadingScreen stage="ANALYZING" />;
    }
    if (processState === ProcessState.RESULT) {
      return summary && <SubmissionResult summary={summary} onReset={handleResetAfterSubmission} />;
    }

    switch (view) {
      case AppView.FORM:
        return <ReportForm onSubmit={handleSubmit} error={error} onCancel={() => handleNavigate(AppView.LIST)} />;
      case AppView.SETTINGS:
        return <Settings reports={reports} />;
      case AppView.LIST:
      default:
        return <ReportList reports={reports} />;
    }
  };

  const isNavVisible = processState === ProcessState.IDLE && view !== AppView.SETTINGS;

  return (
    <div className="w-screen h-screen max-w-md mx-auto bg-[--primary-bg] text-[--primary-text] shadow-2xl flex flex-col font-sans overflow-hidden antialiased">
      <Header />
      <main className="flex-grow overflow-y-auto p-6 bg-[--secondary-bg]">
        {renderContent()}
      </main>
      {isNavVisible && (
        <AppNavigator currentView={view} onNavigate={handleNavigate} />
      )}
      {processState === ProcessState.AWAITING_CONFIRMATION && originalReportData && redactionResult && (
          <PrivacyModal 
            originalDescription={originalReportData.description}
            sanitizedDescription={redactionResult.sanitized_description}
            originalLocation={originalReportData.location}
            sanitizedLocation={redactionResult.sanitized_location}
            onConfirm={handleConfirmRedaction}
            onCancel={handleCancelRedaction}
          />
      )}
    </div>
  );
};

export default App;
