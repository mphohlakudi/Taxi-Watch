import React from 'react';

interface PrivacyModalProps {
  originalDescription: string;
  sanitizedDescription: string;
  originalLocation: string;
  sanitizedLocation: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DiffViewer: React.FC<{ label: string, original: string; sanitized: string }> = ({ label, original, sanitized }) => {
    const originalText = original || 'Not provided';
    const sanitizedText = sanitized || 'Not provided';

    const hasChanged = originalText.trim() !== sanitizedText.trim();

    return (
         <div>
            <h3 className="text-sm font-medium text-[--secondary-text] mb-1">{label}</h3>
             <div className="bg-black/20 p-3 rounded-md text-base text-[--primary-text] whitespace-pre-wrap">
                {!hasChanged ? (
                    <p>{originalText}</p>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-400 mb-1">Original:</p>
                        <p className="text-red-400/80 line-through">{originalText}</p>
                        <hr className="border-[--separator-color] my-2" />
                        <p className="text-sm font-medium text-gray-400 mb-1">Suggested:</p>
                        <p className="text-green-400">{sanitizedText}</p>
                    </>
                )}
            </div>
        </div>
    );
};


export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  originalDescription,
  sanitizedDescription,
  originalLocation,
  sanitizedLocation,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true" aria-labelledby="privacy-check-title">
        <div className="bg-[--secondary-bg] w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-slide-up-fast">
            <div>
                <h2 id="privacy-check-title" className="text-xl font-bold text-center text-[--primary-text]">Privacy Check</h2>
                <p className="text-sm text-center text-[--secondary-text] mt-2">We've scanned your report for personal info. Please review the changes before we submit it anonymously.</p>
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                <DiffViewer label="Description" original={originalDescription} sanitized={sanitizedDescription} />
                <DiffViewer label="Location" original={originalLocation} sanitized={sanitizedLocation} />
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <button
                    onClick={onConfirm}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-base font-semibold text-white bg-[--critical-red] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--secondary-bg] focus:ring-[--critical-red] transition"
                >
                    Confirm & Submit Anonymously
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-2 text-base font-medium text-[--secondary-text] hover:text-[--primary-text] focus:outline-none transition"
                >
                    Go Back & Edit
                </button>
            </div>
        </div>
    </div>
  );
};
