
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
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 transition-all hover:border-blue-400 hover:shadow-2xl group relative overflow-hidden">
      {/* Platform Badge */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
         <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${
           job.platform?.toLowerCase().includes('linkedin') 
           ? 'bg-blue-50 text-blue-600 border-blue-100' 
           : 'bg-orange-50 text-orange-600 border-orange-100'
         }`}>
           via {job.platform || 'LinkedIn'}
         </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Company Avatar */}
        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-100 group-hover:bg-blue-50 transition-colors shadow-inner">
           <span className="text-4xl font-black group-hover:text-blue-500 transition-colors">{job.company?.[0] || 'J'}</span>
        </div>

        <div className="flex-grow space-y-4">
          <div>
            <h4 className="text-2xl font-black text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{job.title}</h4>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
              <span className="text-base font-bold text-slate-600 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/></svg>
                 {job.company}
              </span>
              <span className="text-base font-bold text-slate-500 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                 {job.location}
              </span>
              <span className="text-base font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 {job.salary || 'Competitive Pay'}
              </span>
              <span className="text-base font-bold text-indigo-600 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                 {job.experienceRequired || 'All levels'}
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 italic">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-200">
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[11px] font-black uppercase border border-slate-200">
                +{skills.length - 5} More
              </span>
            )}
          </div>
        </div>

        <div className="w-full lg:w-48 flex flex-col items-center lg:items-end gap-6 pt-4 lg:pt-0">
          <div className="flex flex-col items-center lg:items-end">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Profile Fit</div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${score > 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]'}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              <span className={`text-sm font-black ${score > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                {score}%
              </span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onApply}
              disabled={isApplied}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                isApplied 
                ? 'bg-slate-100 text-slate-400 shadow-none pointer-events-none' 
                : 'bg-blue-600 text-white hover:bg-slate-900 shadow-blue-100 hover:shadow-slate-200'
              }`}
            >
              {isApplied ? 'Application Sent' : showDraftActions ? 'Resume Application' : 'Apply Now'}
            </button>
            
            {showDraftActions && onNotInterested && (
              <button
                onClick={onNotInterested}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-200"
              >
                Not Interested
              </button>
            )}
          </div>
        </div>
      </div>

      {!showDraftActions && (
        <div className="mt-8 flex items-center gap-5 bg-blue-50/50 rounded-2xl p-5 border border-blue-100 shadow-inner group-hover:bg-blue-50 transition-colors">
          <div className="w-10 h-10 bg-white rounded-xl border border-blue-200 flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            <strong className="text-blue-700 font-black uppercase tracking-tighter mr-2">AI Reasoning:</strong>
            {job.matchReason}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobCard;
