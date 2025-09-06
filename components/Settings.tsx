import React, { useState, useCallback, useEffect } from 'react';
import type { FullReport } from '../types';
import { initGoogleClients, signIn, signOut, uploadFile } from '../services/googleDriveService';


interface SettingsProps {
  reports: FullReport[];
}

const CORRECT_PIN = '0823529389';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M24 9.5c3.9 0 6.9 1.6 9.1 3.7l6.8-6.8C35.9 2.6 30.5 0 24 0 14.9 0 7.3 5.4 3 13l8.4 6.5C13.1 12.3 18.1 9.5 24 9.5z"></path>
      <path fill="#34A853" d="M46.2 25.1c0-1.6-.1-3.2-.4-4.7H24v9h12.5c-.5 2.9-2.2 5.4-4.7 7.1l7.3 5.7c4.3-4 6.9-10 6.9-17.1z"></path>
      <path fill="#FBBC05" d="M11.4 19.5c-1-3.1-1-6.5 0-9.6L3 3.4C-1 10.1-1 18.9 3 25.6l8.4-6.1z"></path>
      <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.6l-7.3-5.7c-2.1 1.4-4.8 2.2-7.7 2.2-6 0-11-2.8-13.4-7.2L3 35c4.3 7.6 11.9 13 21 13z"></path>
    </svg>
);


export const Settings: React.FC<SettingsProps> = ({ reports }) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  // State for Google Drive integration
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveUser, setDriveUser] = useState<{ email: string; name: string; } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  useEffect(() => {
    // Only initialize clients if the settings page is potentially going to be unlocked.
    // This prevents loading google scripts unnecessarily.
    initGoogleClients()
      .then(() => setIsDriveReady(true))
      .catch(err => {
          console.error("Could not initialize Google Drive client:", err);
          // Silently fail, the UI will just not show the Drive options.
      });
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect PIN. Please try again.');
    }
    setPin('');
  };
  
  const generateReportText = useCallback(() => {
    const header = `TAXI WATCH - LAW ENFORCEMENT REPORT\nGenerated on: ${new Date().toISOString()}\nTotal Reports: ${reports.length}\n\n========================================\n\n`;

    const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const reportBody = sortedReports
      .map((report, index) => {
        return `--- REPORT ${index + 1} ---\n` +
               `ID: ${report.id}\n` +
               `Timestamp: ${report.timestamp}\n` +
               `License Plate: ${report.licensePlate}\n` +
               `Incident Category: ${report.incident_category}\n` +
               `Severity: ${report.severity_rating}/5\n` +
               `Location Guess: ${report.location_guess}\n` +
               `Vehicle Description: ${report.vehicle_description}\n` +
               `AI Summary: ${report.summary}\n`;
      })
      .join('\n----------------------------------------\n\n');

    return header + reportBody;
  }, [reports]);

  const handleDownload = useCallback(() => {
    const reportText = generateReportText();
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    link.download = `taxi_watch_report_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generateReportText]);

  const handleDriveConnect = async () => {
    setUploadMessage(null);
    try {
        const user = await signIn();
        setDriveUser(user);
        setIsDriveConnected(true);
    } catch (err) {
        console.error("Google Drive sign-in error:", err);
        setUploadMessage({ type: 'error', text: 'Could not connect to Google Drive.' });
    }
  };

  const handleDriveSignOut = () => {
      signOut();
      setIsDriveConnected(false);
      setDriveUser(null);
  };

  const handleUpload = async () => {
    if (!isDriveConnected || reports.length === 0) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
        const reportText = generateReportText();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `taxi_watch_report_${timestamp}.txt`;
        await uploadFile(fileName, reportText);
        setUploadMessage({ type: 'success', text: 'Report uploaded to Google Drive!' });
    } catch (err) {
        console.error("Upload failed:", err);
        const errorMessage = (err instanceof Error) ? err.message : 'Please try again.';
        setUploadMessage({ type: 'error', text: `Upload failed: ${errorMessage}` });
    } finally {
        setIsUploading(false);
    }
  };


  if (!isUnlocked) {
    return (
      <div className="animate-fade-in text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <h2 className="text-2xl font-bold text-[--primary-text]">Admin Access</h2>
        <p className="text-[--secondary-text] mt-2 mb-6">Enter the PIN to access data export functions.</p>

        <form onSubmit={handlePinSubmit} className="max-w-xs mx-auto space-y-4">
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={10}
            className="w-full text-center text-2xl px-4 py-3 text-[--primary-text] bg-[--tertiary-bg] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--critical-red] transition placeholder:text-[--secondary-text]"
            placeholder="Enter PIN"
            aria-label="PIN Code"
          />
          {error && <p className="text-[--critical-red] text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-full text-base font-semibold text-white bg-[--critical-red] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-[--secondary-bg] focus:ring-[--critical-red] transition disabled:bg-gray-700"
            disabled={pin.length !== 10}
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[--primary-text]">Data Export</h2>
        <p className="text-[--secondary-text] mt-1">Export all collected reports for law enforcement or archival purposes.</p>
      </div>

      <div className="bg-[--tertiary-bg] p-4 rounded-xl">
        <h3 className="font-semibold text-[--primary-text]">Local Download</h3>
        <p className="text-sm text-[--secondary-text] mt-1 mb-4">Download a compiled text file of all reports directly to your device.</p>
        <button
          onClick={handleDownload}
          disabled={reports.length === 0}
          className="w-full py-2 px-4 rounded-full text-base font-semibold text-white bg-gray-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-[--secondary-bg] focus:ring-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition"
        >
          Download Report ({reports.length})
        </button>
      </div>
      
      {isDriveReady && (
        <div className="bg-[--tertiary-bg] p-4 rounded-xl">
          <h3 className="font-semibold text-[--primary-text]">Google Drive Backup</h3>
          {!isDriveConnected ? (
             <>
               <p className="text-sm text-[--secondary-text] mt-1 mb-4">Connect your Google Account to upload the report to a secure folder in your Drive.</p>
               <button onClick={handleDriveConnect} className="w-full flex items-center justify-center py-2 px-4 rounded-full text-base font-semibold text-black bg-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-[--secondary-bg] focus:ring-white transition">
                  <GoogleIcon /> Connect Google Drive
               </button>
             </>
           ) : (
             <>
                <div className="flex items-center justify-between text-sm mb-4">
                    <p className="text-[--secondary-text] truncate">Connected as: <span className="font-medium text-[--primary-text]">{driveUser?.email}</span></p>
                    <button onClick={handleDriveSignOut} className="text-sm text-[--critical-red] font-medium hover:underline focus:outline-none">Sign Out</button>
                </div>
                <button 
                  onClick={handleUpload} 
                  disabled={isUploading || reports.length === 0}
                  className="w-full flex items-center justify-center py-2 px-4 rounded-full text-base font-semibold text-white bg-[--critical-red] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-[--secondary-bg] focus:ring-[--critical-red] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                >
                  {isUploading && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>}
                  {isUploading ? 'Uploading...' : `Upload to Drive (${reports.length})`}
                </button>
             </>
           )}
           {uploadMessage && (
               <p className={`text-sm text-center mt-3 ${uploadMessage.type === 'success' ? 'text-green-400' : 'text-[--critical-red]'}`}>
                   {uploadMessage.text}
               </p>
           )}
        </div>
      )}
    </div>
  );
};