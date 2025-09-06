export enum AppView {
  LIST,
  FORM,
  SETTINGS,
}

export enum ProcessState {
  IDLE,
  REDACTING,
  AWAITING_CONFIRMATION,
  ANALYZING,
  RESULT,
}

export interface ReportData {
  licensePlate: string;
  description: string;
  location: string;
  photo?: {
    base64: string;
    mimeType: string;
  };
}

export interface RedactionResult {
  sanitized_description: string;
  sanitized_location: string;
}

export interface GeminiSummary {
  incident_category: string;
  summary: string;
  severity_rating: number;
  vehicle_description: string;
  location_guess: string;
}

export interface FullReport extends GeminiSummary {
  id: string;
  licensePlate: string;
  timestamp: string;
}
