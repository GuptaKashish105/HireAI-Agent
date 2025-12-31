
import React, { useState, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { UserProfile, Job, AppStatus, ApplicationPackage, View, AppliedJob } from './types';
import { findMatchingJobs, generateApplication, analyzeResume } from './services/geminiService';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import JobCard from './components/JobCard';
import ApplicationModal from './components/ApplicationModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [resumeData, setResumeData] = useState<{ content: string; isPdf: boolean; fileName: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationPackage | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [draftJobs, setDraftJobs] = useState<AppliedJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<AppliedJob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotating loading messages to improve perceived performance
  useEffect(() => {
    let interval: any;
    if (status === AppStatus.SEARCHING_JOBS) {
      const messages = [
        "Scanning LinkedIn India...",
        "Scraping Naukri & Indeed portals...",
        "Identifying 20+ relevant leads...",
        "Converting salary ranges to INR...",
        "Matching skills with job descriptions...",
        "Ranking by match percentage...",
        "Filtering expired listings...",
        "Finalizing your job feed..."
      ];
      let i = 0;
      setLoadingStep(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingStep(messages[i]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const processFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
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
    } else if (extension === 'txt' || extension === 'md') {
      const text = await file.text();
      setResumeData({ content: text, isPdf: false, fileName: file.name });
    } else {
      alert("Unsupported file format. Please use PDF, DOCX, TXT, or MD.");
    }
  };

  const handleOnboard = async () => {
    if (!resumeData) {
      alert("Please upload a resume.");
      return;
    }

    try {
      setStatus(AppStatus.LOADING_PROFILE);
      setLoadingStep('Extracting skills...');
      const data = await analyzeResume(resumeData.content, resumeData.isPdf);
      data.url = 'Uploaded File';
      setProfile(data);
      setStatus(AppStatus.READY);
    } catch (error) {
      console.error("Error onboarding profile:", error);
      setStatus(AppStatus.IDLE);
      alert("Analysis failed. Please try a different file format.");
    } finally {
      setLoadingStep('');
    }
  };

  const handleSearchJobs = async () => {
    if (!profile) return;
    try {
      setStatus(AppStatus.SEARCHING_JOBS);
      // loadingStep is handled by the useEffect sequence now
      setJobs([]); 
      const matchedJobs = await findMatchingJobs(profile);
      setJobs(matchedJobs);
      setStatus(AppStatus.READY);
      setCurrentView('active');
    } catch (error) {
      console.error("Error searching jobs:", error);
      setStatus(AppStatus.READY);
    } finally {
      setLoadingStep('');
    }
  };

  const startApplication = async (job: Job) => {
    setSelectedJob(job);
    setStatus(AppStatus.APPLYING);
    try {
      if (profile) {
        const pkg = await generateApplication(profile, job);
        setApplicationData(pkg);
      }
    } catch (error) {
      console.error("Error generating application:", error);
    } finally {
      setStatus(AppStatus.READY);
    }
  };

  const handleCloseModal = () => {
    if (selectedJob && applicationData) {
      const isAlreadyDraft = draftJobs.some(d => d.job.id === selectedJob.id);
      if (!isAlreadyDraft) {
        const draft: AppliedJob = {
          job: selectedJob,
          application: applicationData,
          appliedDate: new Date().toLocaleDateString()
        };
        setDraftJobs(prev => [...prev, draft]);
      }
    }
    setSelectedJob(null);
    setApplicationData(null);
    setViewingPackage(null);
  };

  const handleCancelDraft = (jobId: string) => {
    setDraftJobs(prev => prev.filter(d => d.job.id !== jobId));
  };

  const finalizeApplication = (userAnswers?: Record<string, string>) => {
    if (!selectedJob || !applicationData) return;
    
    const newAppliedJob: AppliedJob = {
      job: selectedJob,
      application: applicationData,
      appliedDate: new Date().toLocaleDateString(),
      userAnswers: userAnswers
    };

    setAppliedJobs(prev => [...prev, newAppliedJob]);
    setDraftJobs(prev => prev.filter(d => d.job.id !== selectedJob.id));
    
    setSelectedJob(null);
    setApplicationData(null);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Identity Center</h2>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Upload Resume to Start</p>
          </div>
        </div>

        <div className="space-y-3">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) await processFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all text-center ${
              isDragging ? 'border-blue-500 bg-blue-50/20' : 'border-slate-50 hover:border-blue-100 bg-slate-50/30'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={async (e) => { const f = e.target.files?.[0]; if(f) await processFile(f); }} className="hidden" accept=".pdf,.docx,.txt,.md" />
            <div className="mb-2 flex justify-center">
              <svg className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-700">{resumeData ? resumeData.fileName : 'Drop resume here or click to upload'}</p>
            <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, TXT, MD</p>
          </div>
          
          <button
            onClick={handleOnboard}
            disabled={status === AppStatus.LOADING_PROFILE || !resumeData}
            className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-50 active:scale-[0.98]"
          >
            {status === AppStatus.LOADING_PROFILE ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {loadingStep || 'Syncing...'}
              </span>
            ) : 'Activate Job Agent'}
          </button>
        </div>
      </section>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <ProfileCard profile={profile} />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
               </div>
               <h3 className="text-xl font-bold text-slate-900">Agent Status: Ready</h3>
               <p className="text-sm text-slate-400 mt-2 max-w-sm">Your professional profile is active. You can now start searching for matching roles across major Indian job boards.</p>
               <button
                  onClick={handleSearchJobs}
                  disabled={status === AppStatus.SEARCHING_JOBS}
                  className="mt-8 px-10 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-100 min-w-[240px]"
                >
                  {status === AppStatus.SEARCHING_JOBS ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Agent is sourcing...</span>
                      </div>
                      <span className="text-[10px] text-slate-400 animate-pulse font-normal lowercase">{loadingStep}</span>
                    </div>
                  ) : (
                    <>
                      <span>Begin Job Sourcing</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveSearch = () => {
    const appliedIds = new Set(appliedJobs.map(a => a.job.id));
    const draftIds = new Set(draftJobs.map(d => d.job.id));
    const activeLeads = jobs.filter(j => !appliedIds.has(j.id) && !draftIds.has(j.id));

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Active Jobs ({activeLeads.length})</h2>
            <p className="text-sm text-slate-500">Curated opportunities from LinkedIn, Naukri, and Indeed.</p>
          </div>
          <button 
            onClick={handleSearchJobs}
            disabled={status === AppStatus.SEARCHING_JOBS}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {status === AppStatus.SEARCHING_JOBS ? (
              <>
                 <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                 <span>Searching...</span>
              </>
            ) : 'Refresh Feed'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {status === AppStatus.SEARCHING_JOBS && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center animate-pulse">
                <p className="text-blue-700 font-bold text-sm">{loadingStep}</p>
                <div className="w-full max-w-xs mx-auto mt-3 h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2 animate-progress"></div>
                </div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white border border-slate-100 rounded-2xl overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 animate-progress"></div>
                </div>
              ))}
            </div>
          )}

          {activeLeads.length === 0 && status !== AppStatus.SEARCHING_JOBS ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-20 text-center">
              <div className="text-5xl mb-4 opacity-50">🔭</div>
              <h3 className="text-lg font-bold text-slate-800">No active leads</h3>
              <p className="text-sm text-slate-400 mt-2">Source jobs from the dashboard to populate your feed.</p>
            </div>
          ) : (
            activeLeads.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onApply={() => startApplication(job)} 
                isApplied={false}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderApplied = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Applied Jobs</h2>
        <p className="text-sm text-slate-500">Track all your successful submissions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appliedJobs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">🚀</div>
            <h3 className="text-lg font-bold text-slate-800">No applications yet</h3>
            <p className="text-sm text-slate-400 mt-2">Start applying from your pipeline to see them here.</p>
          </div>
        ) : (
          appliedJobs.map((applied, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between group hover:border-green-200 transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-black text-xl">
                  {applied.job.company[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{applied.job.title}</h4>
                  <p className="text-xs text-slate-500">{applied.job.company} • Applied on {applied.appliedDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPackage(applied)}
                className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderArchive = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Draft Materials</h2>
        <p className="text-sm text-slate-500">Sessions interrupted or saved for later review.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {draftJobs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">📂</div>
            <h3 className="text-lg font-bold text-slate-800">No drafts found</h3>
            <p className="text-sm text-slate-400 mt-2">If you close an application before finishing, it will save here.</p>
          </div>
        ) : (
          draftJobs.map((draft, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xl">
                  {draft.job.company[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{draft.job.title}</h4>
                  <p className="text-xs text-slate-500">{draft.job.company} • Drafted on {draft.appliedDate}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleCancelDraft(draft.job.id)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  Cancel Draft
                </button>
                <button 
                  onClick={() => {
                    setSelectedJob(draft.job);
                    setApplicationData(draft.application);
                  }}
                  className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Continue Application
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'active' && renderActiveSearch()}
        {currentView === 'applied' && renderApplied()}
        {currentView === 'archive' && renderArchive()}
      </main>

      {(selectedJob || viewingPackage) && (
        <ApplicationModal 
          job={selectedJob || viewingPackage!.job} 
          isLoading={status === AppStatus.APPLYING}
          applicationData={selectedJob ? applicationData : (viewingPackage?.application || null)}
          onClose={handleCloseModal}
          onFinish={finalizeApplication}
          isReadOnly={!!viewingPackage}
        />
      )}
    </div>
  );
};

export default App;
