
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  draftCount?: number;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, draftCount = 0 }) => {
  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-24 flex items-center justify-between">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => onViewChange('dashboard')}>
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 group-hover:bg-blue-600 transition-colors">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">HireAI <span className="text-blue-600">Pilot</span></h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Autonomous Agent</span>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'active', label: 'Job Feed' },
            { id: 'drafts', label: 'Drafts' },
            { id: 'applied', label: 'History' }
          ].map((nav) => (
            <button 
              key={nav.id}
              onClick={() => onViewChange(nav.id as View)}
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
                currentView === nav.id 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {nav.label}
              {nav.id === 'drafts' && draftCount > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] animate-pulse">
                  {draftCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-black text-lg shadow-sm cursor-pointer hover:border-blue-400 transition-all">
            JD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
