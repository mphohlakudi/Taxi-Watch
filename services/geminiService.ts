import { GoogleGenAI, Type } from "@google/genai";
import type { ReportData, GeminiSummary, RedactionResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const redactPII = async (data: { description: string; location: string }): Promise<RedactionResult> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    Analyze the following text for Personally Identifiable Information (PII).
    PII includes but is not limited to: names of people, specific street addresses, apartment numbers, phone numbers, email addresses, and any other details that could uniquely identify a person or their private location.
    Your task is to replace any found PII with a generic placeholder like '[REDACTED]'.
    Do not summarize the text. Preserve the original meaning and structure as much as possible. If no PII is found, return the original text.

    Description: "${data.description}"
    Location: "${data.location}"
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      sanitized_description: { type: Type.STRING, description: "The description with PII redacted." },
      sanitized_location: { type: Type.STRING, description: "The location with PII redacted." },
    },
    required: ["sanitized_description", "sanitized_location"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as RedactionResult;
  } catch (error) {
    console.error("Error calling Gemini API for PII redaction:", error);
    throw new Error("Failed to perform privacy check with AI.");
  }
};

export const analyzeReport = async (data: ReportData): Promise<GeminiSummary> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    Analyze the following reckless driving report. The report has been pre-scanned for PII. Extract key information and provide a structured summary in JSON format.
    
    Report Details:
    - License Plate: ${data.licensePlate || 'Not provided'}
    - Location: ${data.location || 'Not provided'}
    - Description: ${data.description}
    
    If an image is provided, use it to enhance the vehicle description.
    Categorize the incident (e.g., 'Speeding', 'Illegal Overtake', 'Ignoring Traffic Signal', 'Distracted Driving', 'General Recklessness').
    Rate the severity on a scale of 1 (minor) to 5 (extremely dangerous).
  `;

  const textPart = { text: prompt };
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [textPart];

  if (data.photo) {
    parts.push({
      inlineData: {
        mimeType: data.photo.mimeType,
        data: data.photo.base64,
      },
    });
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      incident_category: { type: Type.STRING, description: "The category of the driving incident." },
      summary: { type: Type.STRING, description: "A concise summary of the incident." },
      severity_rating: { type: Type.INTEGER, description: "A rating from 1 to 5 for the incident's severity." },
      vehicle_description: { type: Type.STRING, description: "Description of the taxi, e.g., 'White Toyota Quantum'." },
      location_guess: { type: Type.STRING, description: "The location of the incident." },
    },
    required: ["incident_category", "summary", "severity_rating", "vehicle_description", "location_guess"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiSummary;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze report with AI.");
  }
};
