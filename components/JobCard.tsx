
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onApply: () => void;
  isApplied: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, isApplied }) => {
  const score = Math.min(100, Math.max(0, Math.round(job.matchScore > 1 ? job.matchScore : job.matchScore * 100)));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:border-blue-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 border border-slate-100 group-hover:bg-blue-50 transition-colors">
             <span className="text-2xl font-black">{job.company[0]}</span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 leading-tight">{job.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-blue-600">{job.company}</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">{job.location}</span>
              {job.salary && (
                 <>
                   <span className="text-slate-300">•</span>
                   <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{job.salary}</span>
                 </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end min-w-[120px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${score > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <span className={`text-xs font-black ${score > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              {score}% Match
            </span>
          </div>
          
          <button
            onClick={onApply}
            disabled={isApplied}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
              isApplied 
              ? 'bg-slate-100 text-slate-400 cursor-default' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 pt-5">
        <div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Responsibilities</h5>
          <ul className="space-y-2">
            {job.responsibilities.slice(0, 4).map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600 leading-tight">
                <span className="text-blue-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Requirements</h5>
          <ul className="space-y-2">
            {job.requirements.slice(0, 4).map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600 leading-tight">
                <span className="text-indigo-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-slate-50 pt-4">
        <div className="flex items-start gap-2 text-[11px] text-slate-500 italic">
          <div className="mt-0.5 text-blue-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="leading-tight"><span className="font-bold text-slate-400 uppercase mr-1">ANALYSIS:</span> {job.matchReason}</span>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
