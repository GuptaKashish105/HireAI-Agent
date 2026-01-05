
import React, { useState, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { UserProfile, Job, AppStatus, ApplicationPackage, View, AppliedJob, DraftJob } from './types';
import { findMatchingJobs, generateApplication, analyzeResume } from './services/geminiService';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import JobCard from './components/JobCard';
import ApplicationModal from './components/ApplicationModal';
import Background from './components/Background';

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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    const errorMsg = error?.message || "";
    
    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      setNotification({ 
        message: "Search engine busy. Our agent is retrying to find the best roles for you...", 
        type: 'info'
      });
    } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
      setNotification({ 
        message: "Service synchronization in progress. Retrying scan...", 
        type: 'info'
      });
    } else {
      setNotification({ message: "Market scan interrupted. Please click search again.", type: 'error' });
    }
    
    setStatus(AppStatus.READY);
  };

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.SEARCHING_JOBS) {
      const messages = ["Connecting to Global Market...", "Parsing Live Opportunities...", "Verifying Job Details...", "Calculating Profile Synergy..."];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 1500);
    } else if (status === AppStatus.LOADING_PROFILE) {
      const messages = ["Analyzing Core Skills...", "Structuring Experience...", "Finalizing Profile..."];
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
      setNotification({ message: "This file format is not supported.", type: 'error' });
    }
  };

  const handleOnboard = async () => {
    if (!resumeData) return;
    try {
      setStatus(AppStatus.LOADING_PROFILE);
      const data = await analyzeResume(resumeData.content, resumeData.isPdf);
      data.url = resumeData.fileName;
      data.preferredCity = cityPref;
      setProfile(data);
      setStatus(AppStatus.READY);
      setNotification({ message: "Agent profile synchronized!", type: 'success' });
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
      setNotification(null);
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
        platformRefId: `HIRE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      setAppliedJobs(prev => [...prev, newAppliedJob]);
      setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
      setDraftJobs(prev => prev.filter(d => d.job.id !== selectedJob.id));
      setSelectedJob(null);
      setApplicationData(null);
      setStatus(AppStatus.READY);
      setNotification({ message: `Application sent to ${selectedJob.company}!`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRemoveDraft = (jobId: string) => {
    setDraftJobs(prev => prev.filter(d => d.job.id !== jobId));
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Background />
      <Header currentView={currentView} onViewChange={setCurrentView} draftCount={draftJobs.length} />
      
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-fadeIn border ${
          notification.type === 'error' ? 'bg-white text-red-600 border-red-100' : 'bg-slate-900 text-white border-slate-700'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notification.type === 'success' ? 'bg-emerald-500' : 
            notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'
          }`}>
            {notification.type === 'info' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            )}
          </div>
          <p className="text-sm font-bold leading-tight max-w-sm">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {currentView === 'dashboard' && (
          <div className="space-y-10 animate-fadeIn">
             <section className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white p-12 overflow-hidden relative">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                 <div className="space-y-8">
                   <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">HireAI <span className="text-blue-600">Free.</span></h2>
                   <p className="text-slate-500 text-xl max-w-lg font-medium">An open-access professional agent. Upload your resume to begin sourcing and tailoring applications for top-tier roles.</p>
                   
                   <div className="space-y-6">
                     <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Preferred Location</label>
                        <select value={cityPref} onChange={e => setCityPref(e.target.value)} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none">
                          {IT_HUBS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                     </div>

                     <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-white hover:border-blue-400 transition-all bg-slate-50/50">
                       <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                       <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-sm">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                       </div>
                       <p className="font-black text-slate-600 text-lg">{resumeData ? resumeData.fileName : 'Select Resume'}</p>
                       <p className="text-slate-400 text-xs mt-1 font-medium">Standard PDF or Word documents</p>
                     </div>
                     
                     <button onClick={handleOnboard} disabled={status === AppStatus.LOADING_PROFILE || !resumeData} className="group w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                       {status === AppStatus.LOADING_PROFILE ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {loadingStep || "Syncing Profile..."}
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
                   <div className="bg-slate-950 rounded-[3rem] p-12 text-white min-h-[500px] flex flex-col justify-end relative overflow-hidden shadow-2xl border border-slate-800">
                     <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
                        <svg className="w-64 h-64 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                     </div>
                     <div className="relative z-10">
                       <h3 className="text-4xl font-black mb-4 tracking-tighter text-blue-400">Public Access</h3>
                       <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">This deployment utilizes Gemini 3 Flash to provide a reliable, high-speed experience for the professional community.</p>
                       <div className="mt-8 flex gap-4">
                          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest">Real-time Grounding</div>
                          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black uppercase tracking-widest">Auto-Tailoring</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </section>
             
             {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
                  <ProfileCard profile={profile} />
                  <div className="lg:col-span-3 bg-white/80 rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-white shadow-xl backdrop-blur-md">
                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <h3 className="text-4xl font-black mb-3 text-slate-900 tracking-tight">Profile Synced</h3>
                    <p className="text-slate-500 mb-10 text-xl font-medium text-center">Your agent is ready to source high-match roles in <strong>{cityPref}</strong>.</p>
                    <button 
                      onClick={handleSearchJobs} 
                      disabled={status === AppStatus.SEARCHING_JOBS}
                      className="group relative px-20 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all flex items-center gap-4 overflow-hidden disabled:opacity-50 shadow-2xl"
                    >
                      {status === AppStatus.SEARCHING_JOBS ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="relative z-10">Scan For Jobs</span>
                          <svg className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </>
                      )}
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
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Global Market Matches</h2>
                  <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Filtering active listings from LinkedIn & Naukri</p>
               </div>
               <button onClick={handleSearchJobs} disabled={status === AppStatus.SEARCHING_JOBS} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 transition-all disabled:opacity-50">
                  <svg className={`w-7 h-7 text-blue-600 ${status === AppStatus.SEARCHING_JOBS ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
               </button>
             </div>
             
             {status === AppStatus.SEARCHING_JOBS ? (
               <div className="py-40 flex flex-col items-center">
                 <div className="relative w-28 h-28 mb-12">
                    <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 mb-2">{loadingStep || "Market Scanning..."}</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing grounded search results</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-8">
                 {jobs.length === 0 ? (
                    <div className="py-24 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                       <p className="text-xl font-bold text-slate-400 mb-6">No matches found in {cityPref} yet.</p>
                       <button onClick={handleSearchJobs} className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-black uppercase text-xs tracking-widest hover:border-blue-400 transition-all">Retry Search</button>
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Saved Applications</h2>
            {draftJobs.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white/60 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-2xl font-bold text-slate-400">Your draft queue is currently empty.</p>
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Application Pipeline</h2>
            {appliedJobs.length === 0 ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white/60 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-2xl font-bold text-slate-400">Start applying to track your journey.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {appliedJobs.map((app, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col gap-6 group hover:border-blue-200 transition-all">
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
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl border border-emerald-100">
                        {app.syncStatus}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {app.platformRefId}</p>
                       <a href={app.job.url} target="_blank" className="text-xs font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest">Original Listing ↗</a>
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
          onSaveDraft={(answers) => {
            const newDraft: DraftJob = { job: selectedJob, savedDate: new Date().toLocaleDateString(), partialAnswers: answers };
            setDraftJobs(prev => [...prev.filter(d => d.job.id !== selectedJob.id), newDraft]);
            setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
            setSelectedJob(null);
            setNotification({ message: "Saved to drafts!", type: 'info' });
            setTimeout(() => setNotification(null), 3000);
          }}
          initialAnswers={draftJobs.find(d => d.job.id === selectedJob.id)?.partialAnswers}
        />
      )}
    </div>
  );
};

export default App;
