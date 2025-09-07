import { GoogleGenAI, Type } from "@google/genai";
import type { ReportData, GeminiSummary, RedactionResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const redactPII = async (data: { description: string; location: string }): Promise<RedactionResult> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    You are a highly advanced PII (Personally Identifiable Information) detection and redaction system.
    Your task is to analyze the provided 'Description' and 'Location' text and replace any found PII with the placeholder '[REDACTED]'.
    Preserve the original meaning, context, and structure of the text as much as possible. If no PII is found, return the original text unchanged.

    Redact the following types of PII:
    - Names of people (e.g., "John Doe", "Mrs. Zuma").
    - Phone numbers (including South African formats like 082 123 4567, +27 82 123 4567).
    - Email addresses.
    - Social media handles (e.g., @username).
    - Specific street addresses (e.g., "123 Main Road, Cape Town").
    - Apartment or unit numbers.
    - South African ID numbers.
    - Vehicle license plate numbers mentioned within the text (e.g., "the taxi with plate CA 123-456").
    - Any other information that could uniquely identify an individual or their private residence.

    Input Text:
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