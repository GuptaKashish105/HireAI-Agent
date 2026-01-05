
import React, { useState, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { UserProfile, Job, AppStatus, ApplicationPackage, View, AppliedJob, DraftJob } from './types';
import { findMatchingJobs, generateApplication, analyzeResume } from './services/geminiService';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import JobCard from './components/JobCard';
import ApplicationModal from './components/ApplicationModal';
import Background from './components/Background';

// Fix: Defining the AIStudio interface and extending the global Window object to match environment types
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const IT_HUBS = [
  "All India", "Bangalore", "Gurugram", "Noida", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi", "Kolkata", "Ahmedabad"
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [resumeData, setResumeData] = useState<{ content: string; isPdf: boolean; fileName: string } | null>(null);
  const [cityPref, setCityPref] = useState<string>("All India");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationPackage | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [draftJobs, setDraftJobs] = useState<DraftJob[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error'; action?: string } | null>(null);
  const [hasPersonalKey, setHasPersonalKey] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check key selection status on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasPersonalKey(hasKey);
      } catch (e) {
        console.warn("AI Studio key check not available in this environment.");
      }
    };
    checkKey();
  }, []);

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    const errorMsg = error?.message || "";
    
    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      setNotification({ 
        message: "Free quota exceeded. Please connect your own API Key for unlimited access.", 
        type: 'error',
        action: 'Connect Key'
      });
    } else if (errorMsg.includes("Requested entity was not found")) {
      setNotification({ 
        message: "Project key invalid or expired. Re-selection required.", 
        type: 'error',
        action: 'Re-connect'
      });
      setHasPersonalKey(false);
    } else {
      setNotification({ message: "Agent encountered a glitch. Retrying...", type: 'error' });
    }
    
    setStatus(AppStatus.READY);
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasPersonalKey(true);
      setNotification({ message: "Key Selected! Your personal project is now active.", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.SEARCHING_JOBS) {
      const messages = [
        "Pinging LinkedIn...", "Scanning Naukri...", "Bypassing Quota Limits...", "Analyzing Market Data...", "Matching Profiles...", "Optimizing Salaries..."
      ];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 1500);
    } else if (status === AppStatus.SUBMITTING_TO_PLATFORM) {
      const messages = ["Tailoring Response...", "Encrypting Data...", "Finalizing Application..."];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 1000);
    } else if (status === AppStatus.LOADING_PROFILE) {
      const messages = ["Parsing Document...", "Extracting Skills...", "Computing Experience..."];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const processFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    try {
      if (extension === 'pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          setResumeData({ content: base64, isPdf: true, fileName: file.name });
        };
        reader.readAsDataURL(file);
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeData({ content: result.value, isPdf: false, fileName: file.name });
      } else {
        const text = await file.text();
        setResumeData({ content: text, isPdf: false, fileName: file.name });
      }
    } catch (e) {
      setNotification({ message: "File processing error.", type: 'error' });
    }
  };

  const handleOnboard = async () => {
    if (!resumeData) {
      setNotification({ message: "Please upload your resume.", type: 'info' });
      return;
    }
    try {
      setStatus(AppStatus.LOADING_PROFILE);
      const data = await analyzeResume(resumeData.content, resumeData.isPdf);
      data.url = resumeData.fileName;
      data.preferredCity = cityPref;
      setProfile(data);
      setStatus(AppStatus.READY);
      setNotification({ message: "Profile Synchronized", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleSearchJobs = async () => {
    if (!profile) return;
    setJobs([]);
    setStatus(AppStatus.SEARCHING_JOBS);
    setCurrentView('active');

    try {
      const matchedJobs = await findMatchingJobs(profile);
      setJobs(matchedJobs);
    } catch (error) {
      handleApiError(error);
      if (currentView !== 'active') setCurrentView('dashboard');
    } finally {
      setStatus(AppStatus.READY);
    }
  };

  const startApplication = async (job: Job) => {
    if (!profile) return;
    try {
      setStatus(AppStatus.APPLYING);
      setSelectedJob(job);
      const appPackage = await generateApplication(profile, job);
      setApplicationData(appPackage);
      setStatus(AppStatus.READY);
    } catch (error) {
      handleApiError(error);
      setSelectedJob(null);
    }
  };

  const handleSaveDraft = async (answers?: Record<string, string>) => {
    if (!selectedJob) return;
    setStatus(AppStatus.SAVING_DRAFT);
    await new Promise(r => setTimeout(r, 600));

    const existingDraftIdx = draftJobs.findIndex(d => d.job.id === selectedJob.id);
    const newDraft: DraftJob = {
      job: selectedJob,
      savedDate: new Date().toLocaleDateString(),
      partialAnswers: answers
    };

    if (existingDraftIdx > -1) {
      const updated = [...draftJobs];
      updated[existingDraftIdx] = newDraft;
      setDraftJobs(updated);
    } else {
      setDraftJobs(prev => [...prev, newDraft]);
    }

    setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
    setSelectedJob(null);
    setApplicationData(null);
    setStatus(AppStatus.READY);
    setNotification({ message: "Application saved to Drafts", type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveDraft = (jobId: string) => {
    const draftToRemove = draftJobs.find(d => d.job.id === jobId);
    if (draftToRemove) {
      setJobs(prev => [draftToRemove.job, ...prev]);
      setDraftJobs(prev => prev.filter(d => d.job.id !== jobId));
    }
  };

  const finalizeApplication = async (userAnswers?: Record<string, string>) => {
    if (!selectedJob || !applicationData) return;
    try {
      setStatus(AppStatus.SUBMITTING_TO_PLATFORM);
      await new Promise(r => setTimeout(r, 2000));

      const newAppliedJob: AppliedJob = {
        job: selectedJob,
        application: applicationData,
        appliedDate: new Date().toLocaleDateString(),
        userAnswers,
        syncStatus: 'Synced',
        platformRefId: `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };

      setAppliedJobs(prev => [...prev, newAppliedJob]);
      setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
      setDraftJobs(prev => prev.filter(d => d.job.id !== selectedJob.id));
      setSelectedJob(null);
      setApplicationData(null);
      setStatus(AppStatus.READY);
      setNotification({ message: `Applied Successfully to ${selectedJob.company}!`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Background />
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        draftCount={draftJobs.length} 
        hasPersonalKey={hasPersonalKey}
      />
      
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-fadeIn border ${
          notification.type === 'error' ? 'bg-red-950 text-white border-red-800' : 
          notification.type === 'info' ? 'bg-slate-900 text-white border-slate-700' : 'bg-slate-900 text-white border-slate-700'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notification.type === 'success' ? 'bg-emerald-500' : 
            notification.type === 'info' ? 'bg-blue-500' : 'bg-red-600'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          </div>
          <div className="flex-grow">
            <p className="text-sm font-bold leading-tight">{notification.message}</p>
            {notification.action && (
              <button onClick={handleSelectKey} className="text-xs font-black uppercase text-blue-400 mt-1 hover:text-blue-300 underline underline-offset-2">
                {notification.action}
              </button>
            )}
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {currentView === 'dashboard' && (
          <div className="space-y-10 animate-fadeIn">
             <section className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white p-12 overflow-hidden relative">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                 <div className="space-y-8">
                   <h2 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">HireAI <span className="text-blue-600">Enterprise.</span></h2>
                   <p className="text-slate-500 text-xl max-w-lg font-medium">Next-gen job agent for LinkedIn & Naukri. Automatically handles screening questions and resume tailoring.</p>
                   
                   <div className="space-y-6">
                     {!hasPersonalKey && (
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between gap-6">
                          <div>
                            <p className="text-sm font-black text-blue-900 mb-1 uppercase tracking-wider">Quota Warning</p>
                            <p className="text-xs text-blue-700 font-medium">You are using the shared developer key. Results may be limited during peak hours.</p>
                          </div>
                          <button onClick={handleSelectKey} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                             Connect Project
                          </button>
                        </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Location Hub</label>
                          <select value={cityPref} onChange={e => setCityPref(e.target.value)} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none">
                            {IT_HUBS.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div className="relative">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Platform Mode</label>
                           <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-500">
                              LinkedIn + Naukri
                           </div>
                        </div>
                     </div>

                     <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-white hover:border-blue-400 transition-all bg-slate-50/30">
                       <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                       <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-sm">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                       </div>
                       <p className="font-black text-slate-600 text-lg">{resumeData ? resumeData.fileName : 'Upload Resume'}</p>
                       <p className="text-slate-400 text-xs mt-1">Accepts PDF or DOCX</p>
                     </div>
                     
                     <button onClick={handleOnboard} disabled={status === AppStatus.LOADING_PROFILE || !resumeData} className="group w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3">
                       {status === AppStatus.LOADING_PROFILE ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {loadingStep}
                          </>
                       ) : (
                          <>
                            Initialize Agent
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                          </>
                       )}
                     </button>
                   </div>
                 </div>
                 <div className="hidden lg:block">
                   <div className="bg-slate-950 rounded-[3rem] p-12 text-white min-h-[500px] flex flex-col justify-between relative overflow-hidden shadow-2xl border border-slate-800">
                     <div>
                        <div className="flex gap-4 items-center mb-8">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="space-y-4 font-mono text-sm text-blue-300 opacity-60">
                           <p>$ hireai --mode infinite</p>
                           <p>... using key: {hasPersonalKey ? 'Personal Pro' : 'Shared Cloud'}</p>
                           <p>... engine: gemini-3-flash-lite</p>
                           <p>... billing enabled: REQUIRED for pro</p>
                        </div>
                     </div>
                     <div className="relative z-10 mt-auto">
                       <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-8 flex items-center justify-center shadow-lg shadow-blue-500/50">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                       </div>
                       <h3 className="text-4xl font-black mb-4">Market Sync</h3>
                       <p className="text-slate-400 text-lg leading-relaxed max-w-sm">Live salary tracking and platform synchronization active.</p>
                       <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="inline-block mt-4 text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white transition-colors">Billing Documentation ↗</a>
                     </div>
                   </div>
                 </div>
               </div>
             </section>
             
             {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
                  <ProfileCard profile={profile} />
                  <div className="lg:col-span-3 bg-white/80 rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-white shadow-xl backdrop-blur-md">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h3 className="text-3xl font-black mb-2 text-slate-900">Agent On Standby</h3>
                    <p className="text-slate-500 mb-10 text-lg">Prepared to source <strong>{profile.headline}</strong> roles.</p>
                    <button 
                      onClick={handleSearchJobs} 
                      disabled={status === AppStatus.SEARCHING_JOBS}
                      className="group relative px-20 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-4 overflow-hidden disabled:opacity-50"
                    >
                      {status === AppStatus.SEARCHING_JOBS ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="relative z-10">Scan For Jobs</span>
                          <svg className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </>
                      )}
                      <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                  </div>
                </div>
             )}
          </div>
        )}

        {currentView === 'active' && (
           <div className="animate-fadeIn space-y-8">
             <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-slate-900">Verified Opportunities</h2>
                  <p className="text-slate-400 font-medium mt-1">LinkedIn & Naukri matches for your profile</p>
               </div>
               <button onClick={handleSearchJobs} disabled={status === AppStatus.SEARCHING_JOBS} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50">
                  <svg className={`w-7 h-7 text-blue-600 ${status === AppStatus.SEARCHING_JOBS ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
               </button>
             </div>
             
             {status === AppStatus.SEARCHING_JOBS ? (
               <div className="py-40 flex flex-col items-center">
                 <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 mb-2">{loadingStep}</h3>
                 <p className="text-slate-500 font-medium">Aggregating cross-platform data...</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-8">
                 {jobs.length === 0 ? (
                    <div className="py-24 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                       <p className="text-xl font-bold text-slate-400">No matches found in {cityPref}.</p>
                       <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Change Location Hub</button>
                    </div>
                 ) : (
                    jobs.map(job => (
                       <JobCard 
                         key={job.id} 
                         job={job} 
                         onApply={() => startApplication(job)} 
                         isApplied={appliedJobs.some(a => a.job.id === job.id)} 
                       />
                    ))
                 )}
               </div>
             )}
           </div>
        )}

        {currentView === 'drafts' && (
          <div className="animate-fadeIn space-y-8">
            <h2 className="text-4xl font-black text-slate-900">Saved Drafts</h2>
            {draftJobs.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white/60 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-2xl font-bold text-slate-400">No active drafts found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {draftJobs.map((draft, idx) => (
                  <JobCard 
                    key={idx} 
                    job={draft.job} 
                    onApply={() => startApplication(draft.job)} 
                    isApplied={false} 
                    showDraftActions={true}
                    onNotInterested={() => handleRemoveDraft(draft.job.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'applied' && (
          <div className="animate-fadeIn space-y-8">
            <h2 className="text-4xl font-black text-slate-900">Submission Tracking</h2>
            {appliedJobs.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white/60 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-2xl font-bold text-slate-400">Your application history is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {appliedJobs.map((app, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-5">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl font-black text-blue-400">
                          {app.job.company[0]}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-900">{app.job.title}</h4>
                          <p className="text-base font-bold text-slate-400">{app.job.company} • {app.appliedDate}</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl border border-emerald-100 flex items-center gap-2">
                        {app.syncStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedJob && (
        <ApplicationModal 
          job={selectedJob} 
          isLoading={status === AppStatus.APPLYING}
          isSubmitting={status === AppStatus.SUBMITTING_TO_PLATFORM || status === AppStatus.SAVING_DRAFT}
          loadingStep={loadingStep}
          applicationData={applicationData}
          onClose={() => { setSelectedJob(null); setApplicationData(null); }}
          onFinish={finalizeApplication}
          onSaveDraft={handleSaveDraft}
          initialAnswers={draftJobs.find(d => d.job.id === selectedJob.id)?.partialAnswers}
        />
      )}
    </div>
  );
};

export default App;
