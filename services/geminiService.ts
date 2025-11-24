import { GoogleGenAI } from "@google/genai";

// Initialize GenAI client safely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRisk = async (protocol: string, asset: string, currentScore: number): Promise<string> => {
  try {
    const prompt = `
      Act as a Senior DeFi Risk Analyst. 
      Analyze the current risk profile for lending ${asset} on ${protocol}.
      The current calculated safety score is ${currentScore}/100.
      
      Provide a concise, 3-bullet point summary of potential risks (e.g., smart contract bugs, liquidity crises, depegging, governance attacks) that might be contributing to this score or could cause it to drop further.
      Keep the tone professional, technical, and urgent if the score is low.
      Do not include intro or outro text, just the bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis incomplete.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Analysis temporarily unavailable due to connection issues.";
  }
};