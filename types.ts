
export interface UserProfile {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  totalYearsOfExperience?: number;
  url: string;
  preferredCity?: string;
  email?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  description: string;
  fullJD?: string;
  url: string;
  matchScore: number; // 0-100
  matchReason: string;
  responsibilities: string[];
  requirements: string[];
  skillsRequired: string[];
  experienceRequired: string;
  salary: string; // Target INR
  postedDate?: string;
}

export interface AppliedJob {
  job: Job;
  application: ApplicationPackage;
  appliedDate: string;
  userAnswers?: Record<string, string>;
  syncStatus: 'Synced' | 'Pending' | 'Recruiter Viewed' | 'Action Required';
  platformRefId?: string;
}

export interface DraftJob {
  job: Job;
  savedDate: string;
  partialAnswers?: Record<string, string>;
}

export interface ApplicationPackage {
  jobId: string;
  coverLetter: string;
  resumeTailoringTips: string[];
  suggestedAnswers: Record<string, string>;
  requiredAdditionalInfo: string[]; 
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING_PROFILE = 'LOADING_PROFILE',
  SEARCHING_JOBS = 'SEARCHING_JOBS',
  APPLYING = 'APPLYING',
  SUBMITTING_TO_PLATFORM = 'SUBMITTING_TO_PLATFORM',
  SAVING_DRAFT = 'SAVING_DRAFT',
  READY = 'READY'
}

export type View = 'dashboard' | 'active' | 'applied' | 'drafts';

export interface PlatformConnection {
  name: 'LinkedIn' | 'Naukri';
  connected: boolean;
  lastSync?: string;
}
