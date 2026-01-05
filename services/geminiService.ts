
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

  // Use gemini-3-flash-preview for general text extraction and reasoning
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
 * High-speed job sourcing using search grounding for real-time market data.
 */
export const findMatchingJobs = async (profile: UserProfile): Promise<Job[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const city = profile.preferredCity || "India";
  const exp = profile.totalYearsOfExperience || 0;

  // Phase 1: Search using gemini-3-flash-preview with search grounding
  const searchResult = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find 10 active job listings for "${profile.headline}" in ${city} for LinkedIn and Naukri. Focus on roles requiring approx ${exp} years experience. Return descriptive snippets and listing URLs.`,
    config: { 
      tools: [{ googleSearch: {} }] 
    }
  });

  const rawText = searchResult.text;
  // Extracting grounding metadata to ensure URLs are captured as per grounding display requirements
  const groundingChunks = searchResult.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sourceContext = JSON.stringify(groundingChunks);

  // Phase 2: Structuring JSON and verified URL extraction
  const structuredResult = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Convert the following job data into a structured JSON array. Ensure 'salary' is in INR. MatchScore should be 0.9-1.0 if highly relevant.
    Raw Data: ${rawText}
    Verified Grounding Sources: ${sourceContext}`,
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
            url: { type: Type.STRING, description: 'The direct source URL from the grounding sources.' },
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
    id: j.id || Math.random().toString(36).substr(2, 9),
    matchScore: j.matchScore ? (j.matchScore > 1 ? j.matchScore : j.matchScore * 100) : 85
  }));
};

/**
 * Generates tailored application materials using gemini-3-flash-preview.
 */
export const generateApplication = async (profile: UserProfile, job: Job): Promise<ApplicationPackage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a high-conversion application for ${job.title} at ${job.company} for ${profile.name}. Include resume tailoring tips and identify 3 screening questions the recruiter might ask based on this JD.`,
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
};
