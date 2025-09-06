import React, { useState, useEffect } from 'react';

const messages = {
  REDACTING: [
    "Performing privacy scan...",
    "Checking for personal information...",
    "Anonymizing your report...",
  ],
  ANALYZING: [
    "Analyzing incident details...",
    "Consulting traffic safety protocols...",
    "Generating a structured summary...",
    "Finalizing your anonymous report...",
    "Almost there...",
  ]
};

interface LoadingScreenProps {
  stage: 'REDACTING' | 'ANALYZING';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage }) => {
  const [message, setMessage] = useState(messages[stage][0]);

  useEffect(() => {
    const messageList = messages[stage];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messageList.length;
      setMessage(messageList[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, [stage]);
  
  const title = stage === 'REDACTING' ? 'Checking for Privacy' : 'Processing Your Report';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
      <div className="w-16 h-16 border-4 border-[--critical-red]/50 border-t-[--critical-red] rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold text-[--primary-text]">{title}</h2>
      <p className="text-[--secondary-text] mt-2 transition-opacity duration-500">{message}</p>
    </div>
  );
};
