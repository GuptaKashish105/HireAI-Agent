
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  draftCount?: number;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, draftCount = 0 }) => {
  return (
    <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-50 pt-3 md:pt-5 border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-auto lg:h-16 flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 lg:pb-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3.5 cursor-pointer group self-start lg:self-center" onClick={() => onViewChange('dashboard')}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">HireAI <span className="text-blue-600">Open</span></h1>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1 flex items-center gap-1.5">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
               Agent Live
            </span>
          </div>
        </div>
        
        {/* Navigation Pill */}
        <nav className="flex items-center gap-1 bg-slate-100/60 border border-slate-200/50 p-1 rounded-full shadow-sm max-w-full overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'active', label: 'Matches' },
            { id: 'drafts', label: 'Drafts' },
            { id: 'applied', label: 'Tracking' }
          ].map((nav) => (
            <button 
              key={nav.id}
              onClick={() => onViewChange(nav.id as View)}
              className={`px-5 md:px-7 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 whitespace-nowrap ${
                currentView === nav.id 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {nav.label}
              {nav.id === 'drafts' && draftCount > 0 && (
                <span className="w-3.5 h-3.5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[7px] font-black">
                  {draftCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Status Area */}
        <div className="hidden sm:flex items-center gap-5 self-end lg:self-center">
          <div className="flex flex-col items-end">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Public Access</p>
            <p className="text-[9px] font-black text-emerald-500 tracking-tight">Flash-3 Agent</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-black text-xs shadow-sm">
            AI
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
