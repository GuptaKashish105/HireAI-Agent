
export interface UserProfile {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  url: string;
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
  description: string;
  url: string;
  matchScore: number;
  matchReason: string;
  responsibilities: string[];
  requirements: string[];
  salary?: string;
}

export interface AppliedJob {
  job: Job;
  application: ApplicationPackage;
  appliedDate: string;
  userAnswers?: Record<string, string>;
}

export interface ApplicationPackage {
  jobId: string;
  coverLetter: string;
  resumeTailoringTips: string[];
  suggestedAnswers: Record<string, string>;
  requiredAdditionalInfo: string[]; // Questions the model thinks the user should answer
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING_PROFILE = 'LOADING_PROFILE',
  SEARCHING_JOBS = 'SEARCHING_JOBS',
  APPLYING = 'APPLYING',
  READY = 'READY'
}

export type View = 'dashboard' | 'active' | 'applied' | 'archive';
