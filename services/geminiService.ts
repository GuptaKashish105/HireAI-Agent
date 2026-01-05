
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Job, ApplicationPackage } from "../types";

/**
 * Utility to execute Gemini calls with exponential backoff for 429 errors.
 * Improved with more retries and jitter for free-tier resilience.
 */
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
    
    if (isRateLimit && retries > 0) {
      // Add jitter to delay (±500ms)
      const jitter = Math.random() * 1000 - 500;
      const actualDelay = delay + jitter;
      
      console.warn(`Quota reached. Cooling down for ${Math.round(actualDelay)}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      // Increase backoff multiplier to 2.5x for free tier
      return executeWithRetry(fn, retries - 1, delay * 2.5);
    }
    throw error;
  }
}

/**
 * Analyzes resume content for professional profile extraction.
 */
export const analyzeResume = async (content: string, isPdf: boolean = false): Promise<UserProfile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [
    { text: "Extract professional info. Calculate total years of experience. Format: name, headline, summary, skills, experience." }
  ];

  if (isPdf) {
    parts.push({
      inlineData: {
        data: content,
        mimeType: "application/pdf"
      }
    });
  } else {
    parts.push({ text: `RESUME CONTENT:\n${content}` });
  }

  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            totalYearsOfExperience: { type: Type.NUMBER },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["name", "headline", "summary", "skills", "experience"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as UserProfile;
  });
};

/**
 * High-speed job sourcing using Gemini-3-Flash-Preview with Search Grounding.
 */
export const findMatchingJobs = async (profile: UserProfile): Promise<Job[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const city = profile.preferredCity || "India";
  const exp = profile.totalYearsOfExperience || 0;

  return executeWithRetry(async () => {
    // Stage 1: Search discovery
    const searchResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 10 active job listings for "${profile.headline}" in ${city} from LinkedIn and Naukri. Focus on roles requiring ~${exp} years experience. Return descriptive snippets and official job URLs.`,
      config: { 
        tools: [{ googleSearch: {} }] 
      }
    });

    const rawText = searchResult.text;
    const groundingChunks = searchResult.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Stage 2: Structural parsing
    const structuredResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Convert to structured JSON array. Ensure 'salary' is in INR. MatchScore 85-100 if relevant.
      Data: ${rawText}
      Verified Chunks: ${JSON.stringify(groundingChunks)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              platform: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              matchReason: { type: Type.STRING },
              responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              skillsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
              experienceRequired: { type: Type.STRING },
              salary: { type: Type.STRING }
            },
            required: ["title", "company", "url", "platform"]
          }
        }
      }
    });

    const jobs = JSON.parse(structuredResult.text || '[]') as Job[];
    return jobs.map(j => ({
      ...j,
      id: j.id || Math.random().toString(36).substring(2, 11),
      matchScore: j.matchScore ? (j.matchScore > 1 ? j.matchScore : j.matchScore * 100) : 85
    }));
  });
};

/**
 * Generates tailored application materials for specific jobs.
 */
export const generateApplication = async (profile: UserProfile, job: Job): Promise<ApplicationPackage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a cover letter and tailoring tips for ${job.title} at ${job.company} for ${profile.name}. Identify 3 screening questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobId: { type: Type.STRING },
            coverLetter: { type: Type.STRING },
            resumeTailoringTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedAnswers: { 
              type: Type.OBJECT,
              properties: { why_us: { type: Type.STRING }, relevant_experience: { type: Type.STRING } }
            },
            requiredAdditionalInfo: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["coverLetter", "resumeTailoringTips", "requiredAdditionalInfo"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as ApplicationPackage;
  });
};
