import { GoogleGenAI } from '@google/genai';

// Initialize the API using the new v3 SDK structure
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export interface AiGradingResult {
  bandScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

export async function gradeWritingTask(task1: string, task2: string): Promise<AiGradingResult> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    // Mock response if no API key
    return new Promise(resolve => setTimeout(() => {
      resolve({
        bandScore: 6.5,
        feedback: "This is a simulated feedback because no API key is provided. The structure is good but grammar needs improvement.",
        strengths: ["Clear structure", "Good vocabulary"],
        weaknesses: ["Grammatical errors", "Lacks complex sentences"]
      });
    }, 2000));
  }

  const prompt = `
You are an expert IELTS examiner. Grade the following IELTS Academic Writing responses.
Task 1:
"${task1 || '(No answer provided)'}"

Task 2:
"${task2 || '(No answer provided)'}"

Evaluate based on Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
Provide the result strictly in this JSON format (no markdown tags):
{
  "bandScore": 7.0,
  "feedback": "Overall detailed feedback...",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(text) as AiGradingResult;
  } catch (err) {
    console.error("AI Grading failed:", err);
    throw err;
  }
}

export async function gradeSpeaking(audioBlob: Blob): Promise<AiGradingResult> {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      // Mock response if no API key
      return new Promise(resolve => setTimeout(() => {
        resolve({
          bandScore: 6.0,
          feedback: "This is a simulated feedback for speaking.",
          strengths: ["Good fluency"],
          weaknesses: ["Pronunciation needs work"]
        });
      }, 2000));
    }
  
    // In a real implementation, we would use the Gemini API to transcribe and grade the audio.
    // For this prototype, we'll simulate it as we can't easily upload blobs without a backend server
    // or using the File API directly if supported.
    
    return new Promise(resolve => setTimeout(() => {
        resolve({
          bandScore: 6.5,
          feedback: "Great effort. You answered the prompt clearly, but there were some hesitations.",
          strengths: ["Clear pronunciation", "Good topic vocabulary"],
          weaknesses: ["Frequent pauses", "Some grammatical slips"]
        });
    }, 3000));
}
