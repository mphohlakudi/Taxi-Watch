import React from 'react';
import { AppView } from '../types';

interface AppNavigatorProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NavButton: React.FC<{
  label: string;
  icon: JSX.Element;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const baseClasses = "flex-1 flex flex-col items-center justify-center py-3 text-sm font-medium leading-5 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[--critical-red] focus:ring-offset-2 focus:ring-offset-[--secondary-bg]";
  const activeClasses = "bg-[--critical-red] text-white font-semibold shadow";
  const inactiveClasses = "text-[--secondary-text] bg-[--tertiary-bg] hover:bg-opacity-80 hover:text-[--primary-text]";
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-pressed={isActive}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    {
      view: AppView.FORM,
      label: 'New Report',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
    },
    {
      view: AppView.LIST,
      label: 'Watchlist',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
    }
  ];

  return (
    <div className="w-full p-2 bg-[--primary-bg] border-t border-[--separator-color] flex-shrink-0">
      <div className="flex space-x-2">
        {navItems.map(item => (
          <NavButton
            key={item.label}
            label={item.label}
            icon={item.icon}
            isActive={currentView === item.view}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </div>
    </div>
  );
};