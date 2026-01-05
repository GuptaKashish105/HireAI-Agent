
import React, { useState, useEffect } from 'react';
import { Job, ApplicationPackage } from '../types';

interface ApplicationModalProps {
  job: Job;
  isLoading: boolean;
  isSubmitting?: boolean;
  loadingStep?: string;
  applicationData: ApplicationPackage | null;
  onClose: () => void;
  onFinish: (answers?: Record<string, string>) => void;
  onSaveDraft: (answers?: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ 
  job, 
  isLoading, 
  isSubmitting, 
  loadingStep,
  applicationData, 
  onClose, 
  onFinish,
  onSaveDraft,
  initialAnswers = {}
}) => {
  const [step, setStep] = useState<number>(0); 
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(initialAnswers);

  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setUserAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  const hasQuestions = applicationData && applicationData.requiredAdditionalInfo.length > 0;
  const score = Math.min(100, Math.max(0, Math.round(job.matchScore > 1 ? job.matchScore : job.matchScore * 100)));

  const handleFinish = () => {
    if (!isFormValid) return;
    onFinish(userAnswers);
  };

  const handleSave = () => {
    onSaveDraft(userAnswers);
  };

  const handleAnswerChange = (question: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [question]: val }));
  };

  const isFormValid = applicationData?.requiredAdditionalInfo.every(
    (q) => userAnswers[q] && userAnswers[q].trim().length > 0
  ) ?? true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn border border-white">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-3xl font-black text-slate-300 shadow-sm">
               {job.company[0]}
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{job.title}</h3>
                <p className="text-slate-500 font-bold flex items-center gap-2">
                  {job.company} • {job.location}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-10 custom-scrollbar bg-white">
          {isLoading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative w-20 h-20 mb-10">
                 <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h4 className="text-3xl font-black text-slate-900 mb-2">
                {isSubmitting ? "Finalizing Process..." : "Tailoring Strategy..."}
              </h4>
              <p className="text-slate-500 text-lg font-medium">{loadingStep || "Analyzing role requirements against your skills."}</p>
            </div>
          ) : step === 0 ? (
            <div className="space-y-10 animate-fadeIn">
              <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Detailed Job Insight
                   </h4>
                   <p className="text-slate-700 text-base leading-relaxed mb-10 whitespace-pre-line">{job.description}</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Strategic Match Score</p>
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-blue-600">{score}%</span>
                           <div className="h-10 w-[1px] bg-slate-100"></div>
                           <p className="text-xs font-bold text-slate-500 leading-snug">{job.matchReason}</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Key Technical Stack</p>
                        <div className="flex flex-wrap gap-2">
                           {job.skillsRequired?.map((s, idx) => (
                             <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-tight">{s}</span>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Core Focus Areas
                  </h4>
                  <ul className="space-y-4">
                    {job.responsibilities.slice(0, 4).map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-4 leading-relaxed font-medium">
                        <div className="w-5 h-5 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                          {i+1}
                        </div> 
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Hiring Requirements
                  </h4>
                  <ul className="space-y-4">
                    {job.requirements.slice(0, 4).map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-4 leading-relaxed font-medium">
                        <div className="w-5 h-5 bg-green-50 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                        </div> 
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button onClick={() => setStep(1)} className="group flex-grow py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl shadow-slate-100">
                  Continue to Application
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12 animate-fadeIn">
              {hasQuestions ? (
                <section className="bg-indigo-50/50 rounded-[2rem] p-10 border border-indigo-100">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900">Recruiter Screening</h4>
                        <p className="text-sm font-bold text-indigo-600">Please answer these required questions to proceed.</p>
                     </div>
                  </div>
                  <div className="space-y-8">
                    {applicationData?.requiredAdditionalInfo.map((q, i) => (
                      <div key={i} className="space-y-3">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.15em] ml-1">{q}</label>
                        <textarea 
                          rows={2}
                          value={userAnswers[q] || ''} 
                          onChange={(e) => handleAnswerChange(q, e.target.value)} 
                          placeholder="Type your answer here..."
                          className="w-full px-6 py-4 rounded-2xl border-2 border-indigo-100 bg-white text-base font-medium focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300" 
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="bg-green-50/50 p-10 rounded-[2rem] border border-green-100 flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 mb-2">Direct Apply Enabled</h4>
                   <p className="text-slate-500 font-medium max-w-sm">This role doesn't require extra screening questions. You can submit your tailored application immediately.</p>
                </div>
              )}

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> AI Resume Tailoring Tips
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {applicationData?.resumeTailoringTips.map((tip, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex gap-3 font-medium shadow-sm">
                        <span className="text-blue-500 font-black">#</span>
                        {tip}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button onClick={() => setStep(0)} className="order-2 md:order-1 px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95">
                  Back to Details
                </button>
                <div className="order-1 md:order-2 flex-grow flex gap-4">
                   <button onClick={handleSave} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-400 transition-all active:scale-95">
                     Save as Draft
                   </button>
                   <button 
                     onClick={handleFinish} 
                     disabled={!isFormValid} 
                     className={`flex-[2] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-95 ${
                       isFormValid 
                       ? 'bg-blue-600 text-white hover:bg-slate-950 shadow-blue-100' 
                       : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed border border-slate-200'
                     }`}
                   >
                     Submit Application
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
