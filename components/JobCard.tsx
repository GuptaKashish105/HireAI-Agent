
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onApply: () => void;
  isApplied: boolean;
  onNotInterested?: () => void;
  showDraftActions?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, isApplied, onNotInterested, showDraftActions }) => {
  const score = Math.min(100, Math.max(0, Math.round(job.matchScore > 1 ? job.matchScore : job.matchScore * 100)));
  const skills = job.skillsRequired || [];

  return (
    <div className="bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-2 transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] group animate-fadeIn mb-6 lg:mb-8">
      <div className="p-6 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start relative">
          {/* Avatar Section */}
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center flex-shrink-0 text-slate-300 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-500 shadow-inner">
             <span className="text-4xl font-black">{job.company?.[0] || 'J'}</span>
          </div>

          {/* Details Section */}
          <div className="flex-grow space-y-5 lg:space-y-6">
            <div className="space-y-2">
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                {job.title}
              </h4>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-base font-bold text-slate-400 flex items-center gap-2.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                   {job.company}
                </span>
                <span className="text-base font-bold text-slate-400 flex items-center gap-2.5">
                   <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                   {job.location}
                </span>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                   {job.salary || 'Market Rate'}
                </span>
              </div>
            </div>

            <p className="text-slate-500 text-base md:text-lg leading-relaxed line-clamp-2 font-medium max-w-3xl">
              {job.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.slice(0, 7).map((skill, i) => (
                <span key={i} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200/60 group-hover:bg-white transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action/Synergy Section */}
          <div className="w-full lg:w-64 flex flex-col gap-6 lg:items-end self-stretch justify-between lg:pl-8 lg:border-l lg:border-slate-50">
            <div className="flex flex-col items-center lg:items-end w-full space-y-3">
              <div className="flex items-center gap-3 w-full justify-between lg:justify-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Synergy Match</span>
                {job.platform && (
                  <span className={`text-[8px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${
                    job.platform.toLowerCase().includes('linkedin') 
                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                    : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {job.platform}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 w-full">
                <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <span className="text-xl font-black text-slate-950 w-12 text-right tracking-tighter">{score}%</span>
              </div>
            </div>

            <div className="space-y-3 w-full">
              <button
                onClick={onApply}
                disabled={isApplied}
                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.97] ${
                  isApplied 
                  ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-slate-950 shadow-blue-100'
                }`}
              >
                {isApplied ? 'Applied' : showDraftActions ? 'Resume Draft' : 'Start Application'}
              </button>
              
              {showDraftActions && onNotInterested && (
                <button
                  onClick={onNotInterested}
                  className="w-full py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100"
                >
                  Archive Match
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logic Footer */}
      <div className="bg-slate-50/80 rounded-[2.5rem] m-2 p-5 lg:px-10 flex items-center gap-6 border border-slate-100/50 group-hover:bg-blue-50/30 transition-colors">
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0 group-hover:scale-110 transition-all duration-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
          <span className="text-blue-700 font-black uppercase tracking-widest text-[9px] mr-3">AI Scouting Logic</span>
          {job.matchReason}
        </p>
      </div>
    </div>
  );
};

export default JobCard;
