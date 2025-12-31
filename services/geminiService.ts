
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Job, ApplicationPackage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Analyzes resume content. 
 */
export const analyzeResume = async (content: string, isPdf: boolean = false): Promise<UserProfile> => {
  const parts: any[] = [
    { text: "Extract detailed professional information from the following resume. Be precise and literal." }
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
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          headline: { type: Type.STRING },
          summary: { type: Type.STRING },
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
 * Searches LinkedIn and other platforms for detailed job listings.
 */
export const findMatchingJobs = async (profile: UserProfile): Promise<Job[]> => {
  const prompt = `Act as a high-precision job sourcing agent specialized in the Indian job market. 
    Search extensively across LinkedIn India, Naukri.com, Indeed India, and major company career portals.
    Find 20+ currently open jobs that match this candidate's profile.
    
    CANDIDATE:
    - Name: ${profile.name}
    - Headline: ${profile.headline}
    - Key Skills: ${profile.skills.join(', ')}
    
    FOR EACH JOB, EXTRACT:
    1. Title, Company, Location.
    2. A brief 2-sentence summary.
    3. Exactly 4 key responsibilities.
    4. Exactly 4 key requirements.
    5. Estimated salary IN INDIAN RUPEES (INR) using the ₹ symbol. Preferred format is Lakhs per Annum (e.g., ₹15L - ₹25L). If the listing is in USD, convert using 1 USD = 83 INR.
    6. A match score (0-100) based on technical alignment.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 1024 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING, description: "Brief summary of the role" },
            url: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            matchReason: { type: Type.STRING },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            salary: { type: Type.STRING }
          },
          required: ["id", "title", "company", "location", "description", "url", "matchScore", "matchReason", "responsibilities", "requirements"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as Job[];
};

/**
 * Generates application materials and identifies missing info.
 */
export const generateApplication = async (profile: UserProfile, job: Job): Promise<ApplicationPackage> => {
  const prompt = `Generate a tailored application package for ${profile.name} for the role of ${job.title} at ${job.company}. 
    In addition, identify if there are any specific questions this company usually asks for this type of role that aren't in the profile (e.g. 'Years of experience with Kubernetes', 'Willingness to travel').
    
    JOB DETAILS: ${JSON.stringify(job)}
    USER PROFILE: ${JSON.stringify(profile)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 1024 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobId: { type: Type.STRING },
          coverLetter: { type: Type.STRING },
          resumeTailoringTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedAnswers: { 
            type: Type.OBJECT,
            properties: {
              why_us: { type: Type.STRING },
              relevant_experience: { type: Type.STRING },
              salary_expectations: { type: Type.STRING }
            }
          },
          requiredAdditionalInfo: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "2-3 specific questions for the user to answer to improve the application."
          }
        },
        required: ["jobId", "coverLetter", "resumeTailoringTips", "suggestedAnswers", "requiredAdditionalInfo"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as ApplicationPackage;
};
