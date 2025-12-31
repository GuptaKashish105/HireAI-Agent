
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">HireAI <span className="text-blue-600">Agent</span></h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={`text-sm font-bold transition-colors ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => onViewChange('active')}
            className={`text-sm font-bold transition-colors ${currentView === 'active' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Active Jobs
          </button>
          <button 
            onClick={() => onViewChange('applied')}
            className={`text-sm font-bold transition-colors ${currentView === 'applied' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Applied
          </button>
          <button 
            onClick={() => onViewChange('archive')}
            className={`text-sm font-bold transition-colors ${currentView === 'archive' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Drafts
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
             <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
             </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
