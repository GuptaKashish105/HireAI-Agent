
import React, { useState } from 'react';
import { Job, ApplicationPackage } from '../types';

interface ApplicationModalProps {
  job: Job;
  isLoading: boolean;
  applicationData: ApplicationPackage | null;
  onClose: () => void;
  onFinish: (answers?: Record<string, string>) => void;
  isReadOnly?: boolean;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, isLoading, applicationData, onClose, onFinish, isReadOnly }) => {
  const [step, setStep] = useState<number>(0); // 0: Job Summary, 1: Application Materials & Details
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const handleFinish = () => {
    if (!isFormValid) return;
    onFinish(userAnswers);
  };

  const handleAnswerChange = (question: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [question]: val }));
  };

  // Check if all required recruiter questions have been answered
  const isFormValid = applicationData?.requiredAdditionalInfo.every(
    (q) => userAnswers[q] && userAnswers[q].trim().length > 0
  ) ?? true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Application Dashboard</h3>
            <p className="text-sm text-slate-500">{job.title} @ {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h4 className="text-xl font-bold text-slate-800">Synthesizing Materials</h4>
              <p className="text-slate-400 text-sm mt-2">Our AI is drafting your customized approach...</p>
            </div>
          ) : step === 0 ? (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Job Summary & Fit</h4>
                <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100">
                  <p className="text-slate-700 leading-relaxed italic">"{job.description}"</p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                       <p className="text-[10px] text-slate-400 uppercase font-black">Score</p>
                       <p className="text-lg font-bold text-blue-600">{job.matchScore}% Match</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex-grow">
                       <p className="text-[10px] text-slate-400 uppercase font-black">AI Reasoning</p>
                       <p className="text-sm font-medium text-slate-600">{job.matchReason}</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Responsibilities</h4>
                  <ul className="space-y-2">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-blue-500 font-bold">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Requirements</h4>
                  <ul className="space-y-2">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-indigo-500 font-bold">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {!isReadOnly && (
                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                  <h4 className="font-bold text-lg mb-2">Ready to proceed?</h4>
                  <p className="text-slate-400 text-sm mb-6">We will now generate your tailored cover letter and check for any additional information the recruiter might need.</p>
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Generate Application Materials
                  </button>
                </div>
              )}
              {isReadOnly && (
                 <button 
                    onClick={() => setStep(1)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    View Materials & Strategy
                  </button>
              )}
            </div>
          ) : applicationData && (
            <div className="space-y-10 animate-fadeIn">
               {!isReadOnly && applicationData.requiredAdditionalInfo.length > 0 && (
                <section className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
                  <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recruiter Specifics
                  </h4>
                  <p className="text-sm text-amber-800/80 mb-6">Our agent identified these missing details that recruiters often request for this role. Providing these improves success.</p>
                  <div className="space-y-4">
                    {applicationData.requiredAdditionalInfo.map((q, i) => (
                      <div key={i}>
                        <label className="block text-xs font-black text-amber-900 uppercase tracking-wider mb-2">
                          {q} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text"
                          value={userAnswers[q] || ''}
                          onChange={(e) => handleAnswerChange(q, e.target.value)}
                          placeholder="Your answer..."
                          className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  {!isFormValid && (
                    <p className="text-xs text-red-600 font-bold mt-4 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Please answer all recruiter questions to proceed.
                    </p>
                  )}
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900">Tailored Cover Letter</h4>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(applicationData.coverLetter); alert('Copied!'); }}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Copy
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-inner max-h-60 overflow-y-auto">
                  {applicationData.coverLetter}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resume Adjustments</h4>
                  <div className="space-y-3">
                    {applicationData.resumeTailoringTips.map((tip, i) => (
                      <div key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-600 flex gap-2">
                        <span className="text-indigo-400 font-bold">#</span> {tip}
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prepared Q&A</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl">
                       <p className="text-[9px] font-black text-green-700 uppercase">Why this role?</p>
                       <p className="text-xs text-slate-600 mt-1">{applicationData.suggestedAnswers.why_us}</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                       <p className="text-[9px] font-black text-blue-700 uppercase">Key Experience</p>
                       <p className="text-xs text-slate-600 mt-1">{applicationData.suggestedAnswers.relevant_experience}</p>
                    </div>
                  </div>
                </section>
              </div>

              {!isReadOnly && (
                <div className="bg-blue-600 rounded-2xl p-6 text-white text-center">
                  <h4 className="font-bold text-lg mb-1">Final Submission Confirmation</h4>
                  <p className="text-blue-100 text-sm mb-6 font-medium">By clicking Apply, your materials will be finalized and marked as completed for your records.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setStep(0)}
                      className="flex-grow py-3 bg-blue-700/50 rounded-xl font-bold hover:bg-blue-700 transition-all border border-blue-400/30"
                    >
                      Back to Summary
                    </button>
                    <button 
                      onClick={handleFinish}
                      disabled={!isFormValid}
                      className={`flex-grow-[2] py-3 rounded-xl font-black transition-all shadow-xl ${
                        isFormValid 
                        ? 'bg-white text-blue-600 hover:bg-blue-50' 
                        : 'bg-blue-400 text-blue-200 cursor-not-allowed opacity-80'
                      }`}
                    >
                      Confirm Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
             Step {step + 1} of 2
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-bold text-xs text-slate-500 hover:bg-slate-200 transition-colors"
          >
            {isReadOnly ? 'Close' : 'Cancel & Save to Drafts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
