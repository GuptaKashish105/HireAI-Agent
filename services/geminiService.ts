
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Job, ApplicationPackage } from "../types";

/**
 * Analyzes resume content for high-fidelity profile extraction.
 */
export const analyzeResume = async (content: string, isPdf: boolean = false): Promise<UserProfile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [
    { text: "Fast extract professional info. Calculate total years of experience as an integer. Format: name, headline, summary, skills, experience." }
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 0 },
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
};

/**
 * Fast job sourcing strictly for LinkedIn and Naukri with salary estimation.
 */
export const findMatchingJobs = async (profile: UserProfile): Promise<Job[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const city = profile.preferredCity || "India";
  const exp = profile.totalYearsOfExperience || 0;

  // Phase 1: High-speed targeted search
  const searchResult = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find 8 active jobs for "${profile.headline}" in ${city}.
    STRICT PLATFORM FILTER: ONLY search LinkedIn (site:linkedin.com/jobs) and Naukri (site:naukri.com). EXCLUDE Indeed and others.
    STRICT EXP FILTER: Target exactly ${exp} years.
    MANDATORY SALARY: Extract or ESTIMATE a realistic salary in INR (e.g. ₹15L - ₹25L PA). DO NOT return "Not Disclosed".`,
    config: { 
      tools: [{ googleSearch: {} }] 
    }
  });

  const rawText = searchResult.text;

  // Phase 2: Instant JSON Formatting (No reasoning to reduce latency)
  const structuredResult = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Convert to JSON array. Ensure 'salary' is ALWAYS a specific INR range (e.g. ₹12L - ₹18L PA).
    Data: ${rawText}`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
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
          required: ["title", "company", "url", "salary", "platform"]
        }
      }
    }
  });

  const jobs = JSON.parse(structuredResult.text || '[]') as Job[];
  return jobs.map(j => ({
    ...j,
    id: j.id || Math.random().toString(36).substr(2, 9)
  }));
};

/**
 * Generates application materials.
 */
export const generateApplication = async (profile: UserProfile, job: Job): Promise<ApplicationPackage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Tailor application for ${job.title} at ${job.company} for ${profile.name}.`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
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
        }
      }
    }
  });

  return JSON.parse(response.text || '{}') as ApplicationPackage;
};
