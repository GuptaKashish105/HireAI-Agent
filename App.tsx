
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
  const profileSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile && profileSectionRef.current && currentView === 'dashboard') {
      const timeoutId = setTimeout(() => {
        profileSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [profile, currentView]);

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      setNotification({ message: "Search engine cooling down. Retrying automatically—hold on!", type: 'info' });
    } else {
      setNotification({ message: "Connection issue detected. Please try scanning again.", type: 'error' });
    }
    setStatus(AppStatus.READY);
  };

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.SEARCHING_JOBS) {
      const messages = ["Connecting...", "Parsing Opportunities...", "Verifying Details...", "Calculating Synergy..."];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 1500);
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
      setNotification({ message: "Supported file format error.", type: 'error' });
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
      setNotification({ message: `Success! Found ${matchedJobs.length} active roles.`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
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

  const handleSaveDraft = (answers?: Record<string, string>) => {
    if (!selectedJob) return;
    
    const newDraft: DraftJob = {
      job: selectedJob,
      savedDate: new Date().toLocaleDateString(),
      partialAnswers: answers
    };

    setDraftJobs(prev => {
      const filtered = prev.filter(d => d.job.id !== selectedJob.id);
      return [...filtered, newDraft];
    });

    setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
    setSelectedJob(null);
    setApplicationData(null);
    setNotification({ message: "Strategic draft saved to memory.", type: 'info' });
    setTimeout(() => setNotification(null), 3000);
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
    <div className="min-h-screen relative pb-20 selection:bg-blue-100 font-sans overflow-x-hidden">
      <Background />
      <Header currentView={currentView} onViewChange={setCurrentView} draftCount={draftJobs.length} />
      
      {notification && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fadeIn bg-slate-900 text-white border border-slate-700 backdrop-blur-xl max-w-[90vw]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notification.type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          </div>
          <p className="text-sm font-black tracking-tight">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-full">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 mt-8 md:mt-12">
        {currentView === 'dashboard' && (
          <div className="space-y-12 md:space-y-16 animate-fadeIn">
             <section className="bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-white p-6 lg:p-16 overflow-hidden relative">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                 <div className="space-y-8 lg:space-y-10">
                   <div className="space-y-4">
                     <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100">Autonomous Intelligence</span>
                     <h2 className="text-5xl lg:text-7xl font-black text-slate-950 leading-[0.9] tracking-tighter">HireAI <br/><span className="text-blue-600">Open.</span></h2>
                   </div>
                   <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">Your autonomous professional agent. Upload a resume to synchronize and engage market scouting.</p>
                   
                   <div className="space-y-6 md:space-y-8 bg-slate-50/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100">
                     <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Target Location</label>
                        <select value={cityPref} onChange={e => setCityPref(e.target.value)} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl shadow-sm font-black appearance-none cursor-pointer focus:ring-4 focus:ring-blue-100 outline-none transition-all">
                          {IT_HUBS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                     </div>
                     <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-6 md:p-10 text-center cursor-pointer hover:bg-white hover:border-blue-500 transition-all bg-white/20">
                       <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                       <div className="w-12 h-12 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                       </div>
                       <p className="font-black text-slate-900 text-lg tracking-tight">{resumeData ? resumeData.fileName : 'Synchronize Resume'}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, DOCX, or TXT</p>
                     </div>
                     <button onClick={handleOnboard} disabled={status === AppStatus.LOADING_PROFILE || !resumeData} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-base tracking-widest uppercase hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl">
                       {status === AppStatus.LOADING_PROFILE ? <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Initialize Agent"}
                     </button>
                   </div>
                 </div>
                 <div className="hidden lg:block relative bg-slate-950 rounded-[3.5rem] min-h-[500px] shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150 transition-transform group-hover:rotate-45 duration-1000">
                      <svg className="w-80 h-80 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                    </div>
                    <div className="absolute inset-0 p-16 flex flex-col justify-end">
                       <h3 className="text-4xl md:text-5xl font-black text-blue-400 tracking-tighter mb-4">Grounded Analysis.</h3>
                       <p className="text-slate-400 text-xl font-medium leading-relaxed">Real-time scouting powered by Gemini 3 Flash. Your agent identifies roles that match your competency profile with extreme precision.</p>
                       <div className="mt-8 flex gap-4">
                          <span className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest">Search Grounding</span>
                          <span className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest">Auto Screening</span>
                       </div>
                    </div>
                 </div>
               </div>
             </section>
             {profile && (
                <div ref={profileSectionRef} className="grid grid-cols-1 lg:grid-cols-4 gap-12 animate-fadeIn pb-24 scroll-mt-24">
                  <ProfileCard profile={profile} />
                  <div className="lg:col-span-3 bg-white/60 rounded-[3.5rem] p-10 lg:p-20 flex flex-col items-center justify-center border border-white shadow-2xl backdrop-blur-3xl min-h-[500px]">
                    <div className="w-24 h-24 bg-blue-100/50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner group transition-all hover:bg-blue-600 hover:text-white duration-500">
                      <svg className="w-12 h-12 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <h3 className="text-5xl md:text-6xl font-black mb-4 text-slate-950 tracking-tighter text-center">Ready to Scout?</h3>
                    <p className="text-slate-500 mb-10 text-xl font-medium text-center max-w-2xl leading-relaxed">Intelligence core updated. System ready for deep-scouting in <strong className="text-slate-950">{cityPref}</strong>.</p>
                    <button onClick={handleSearchJobs} disabled={status === AppStatus.SEARCHING_JOBS} className="px-16 py-6 bg-slate-950 text-white rounded-full font-black uppercase tracking-[0.4em] text-xs hover:bg-blue-600 transition-all flex items-center gap-6 shadow-2xl active:scale-95">
                      {status === AppStatus.SEARCHING_JOBS ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Engage Scrutiny"}
                    </button>
                  </div>
                </div>
             )}
          </div>
        )}

        {currentView === 'active' && (
           <div className="animate-fadeIn space-y-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
               <div className="space-y-2">
                  <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter">Live Market Scout</h2>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Sourcing active roles in {cityPref}
                  </p>
               </div>
               <button onClick={handleSearchJobs} disabled={status === AppStatus.SEARCHING_JOBS} className="flex items-center gap-4 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-xl hover:text-blue-600 transition-all group active:scale-95">
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Refresh Engine</span>
                  <svg className={`w-6 h-6 ${status === AppStatus.SEARCHING_JOBS ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
               </button>
             </div>
             {status === AppStatus.SEARCHING_JOBS ? (
               <div className="py-48 flex flex-col items-center">
                 <div className="w-24 h-24 border-8 border-blue-50 border-t-blue-600 rounded-3xl animate-spin mb-8 shadow-2xl"></div>
                 <h3 className="text-3xl font-black text-slate-950 tracking-tight">{loadingStep || "Scanning Market..."}</h3>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-8 lg:gap-10">
                 {jobs.length === 0 ? (
                    <div className="py-32 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                       <p className="text-2xl font-black text-slate-300 mb-8 tracking-tight">No matches found yet.</p>
                       <button onClick={handleSearchJobs} className="px-12 py-4 bg-slate-950 text-white rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl">Restart Scanner</button>
                    </div>
                 ) : (
                    jobs.map(job => (
                       <JobCard key={job.id} job={job} onApply={() => startApplication(job)} isApplied={appliedJobs.some(a => a.job.id === job.id)} />
                    ))
                 )}
               </div>
             )}
           </div>
        )}

        {currentView === 'drafts' && (
          <div className="animate-fadeIn space-y-10">
            <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter">Application Drafts</h2>
            {draftJobs.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-3xl font-black text-slate-300 tracking-tight">System memory empty.</p>
              </div>
            ) : (
              <div className="space-y-8">
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
          <div className="animate-fadeIn space-y-10">
            <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter">Tracking Pipeline</h2>
            {appliedJobs.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-3xl font-black text-slate-300 tracking-tight">No tracking data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {appliedJobs.map((app, idx) => (
                   <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col gap-6 group hover:border-blue-500/20 hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100">
                          {app.job.company[0]}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-950 leading-tight">{app.job.title}</h4>
                          <p className="text-sm font-bold text-slate-500 mt-1">{app.job.company} • {app.appliedDate}</p>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-xl border border-emerald-100">
                        {app.syncStatus}
                      </span>
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex flex-col">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Platform Ref</p>
                          <p className="text-[11px] font-black text-slate-900 mt-1">{app.platformRefId}</p>
                       </div>
                       <div className="px-5 py-2.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">Active Sync</div>
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
          isSubmitting={status === AppStatus.SUBMITTING_TO_PLATFORM} 
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
