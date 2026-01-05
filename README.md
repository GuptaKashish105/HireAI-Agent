# ⚡ HireAI Open: The Autonomous Career Scout

**HireAI Open** is a sophisticated, AI-driven professional agent designed to eliminate the exhausting manual labor of job hunting. By combining the reasoning power of **Gemini 3 Flash** with real-time **Google Search Grounding**, HireAI Open doesn't just search for jobs—it scouts the market like a dedicated career agent.

🔗 Live Demo:
👉 [Launch HireAI Open – Gemini Free Tier](https://aistudio.google.com/apps/drive/1efERimQd4CmiA_qJUhuOKqCXRy8B-ATN?showAssistant=true&showPreview=true&fullscreenApplet=true)


⚠️ **Important Note**
- Runs on **Google Gemini Free Tier**
- During peak usage, **Search Grounding may hit rate limits**
- The agent **automatically retries** when limits are reached
- For uninterrupted usage, run locally with your own Gemini API key

### 🎯 What You Can Try in the Live Demo
- Upload and analyze resumes
- Trigger real-time job scouting
- View AI-generated match scores and reasoning
- Experience the full autonomous workflow of HireAI Open

---

## 🧐 What is HireAI Open?

Traditional job boards require you to sift through thousands of irrelevant listings. **HireAI Open** flips the script. It is an "Autonomous Intelligence" that acts as a bridge between your professional identity (your resume) and the global job market. 

It analyzes your "Technical Core," understands your career trajectory, and proactively identifies high-synergy opportunities that match your specific skill set, experience level, and location preferences.

---

## ⚙️ How It Works: The Mechanism

The agent operates through a four-stage intelligent pipeline:

1.  **High-Fidelity Profile Ingestion**: 
    Using `mammoth.js` and native PDF binary handling, the agent reads your resume. It doesn't just look for keywords; it uses Gemini 3 to extract a nuanced "Technical Core"—summarizing your headline, calculating total years of experience, and verifying your skill proficiency.

2.  **Grounded Market Scouting**: 
    Instead of relying on a static database, the agent triggers **Search Grounding**. It performs live, targeted queries across LinkedIn, Naukri, and top-tier corporate portals to find active roles posted within the last 24-72 hours.

3.  **Strategic Alignment (The Match Score)**: 
    For every discovered role, the agent performs a "Synergy Analysis." It compares the job description requirements against your profile to generate a 0-100% match score, accompanied by an "AI Scouting Logic" explanation that tells you *exactly why* you are a fit (or why you aren't).

4.  **Autonomous Tailoring**: 
    Once a match is selected, the agent drafts a hyper-tailored application package, including a custom cover letter and suggested answers for common recruiter screening questions, ensuring your application stands out from generic submissions.

---

## 🛠️ Current Capabilities

- **Multi-Format Parsing**: Supports `.pdf`, `.docx`, and `.txt` resumes.
- **Location Intelligence**: Target specific IT hubs like Bangalore, Gurugram, or scout "All India."
- **Synergy Match Engine**: Advanced reasoning to explain the logic behind every job recommendation.
- **Application Pipeline**: Track jobs from Discovery → Draft → Applied.
- **Memory Management**: Save interesting roles as drafts to revisit later without losing AI-generated insights.

---

## 🚧 What Still Needs to be Done (Roadmap)

While the core intelligence is live, the following features are currently in the development pipeline:

- [ ] **Direct Platform Integration**: Moving beyond search grounding to direct API integrations with LinkedIn and Naukri for "One-Click Apply."
- [ ] **Email Automation**: An autonomous "Follow-up Agent" that drafts and sends check-in emails to recruiters after 1 week.
- [ ] **Portfolio Sync**: The ability to scrape personal portfolios or GitHub profiles to add more depth to the "Technical Core."
- [ ] **Browser Extension**: A companion tool that activates the agent whenever you are browsing any career site.

---

## 🔮 Future Scope: The 2.0 Vision

The future of HireAI Open goes beyond simple applications:

*   **Multi-Agent Swarms**: Imagine one agent scouting jobs, while another agent automatically networks with recruiters on LinkedIn to request informational interviews.
*   **Real-time Interview Coaching**: A Live API feature where the agent simulates a mock interview for a specific job you just applied to, giving you instant feedback.
*   **Salary Negotiation Coach**: AI-driven market analysis to tell you exactly what salary range you should negotiate for based on the specific JD and your matched skills.
*   **Career Pivot Mode**: Tell the agent where you *want* to go, and it will identify "bridge jobs" that help you transition into a new industry.

---

## 💻 Technical Stack

*   **Runtime**: React 19 + TypeScript
*   **Intelligence**: Google GenAI SDK (Gemini 3 Flash Preview)
*   **Styling**: Tailwind CSS (Elite Glassmorphism UI)
*   **State**: Complex Draft/Tracking Pipeline management
*   **Parsing**: Mammoth.js & Native PDF Buffer handling

---

## ⚡ Quick Start

1.  **Clone the Repo & Install**
    ```bash
    npm install
    ```
2.  **Set Up Keys**
    Create a `.env.local` and add your `API_KEY` (Gemini API Key).
3.  **Launch Agent**
    ```bash
    npm run dev
    ```

---

<div align="center">
  <p>Built with precision for the modern professional by <strong>Kashish Gupta</strong></p>
</div>
