
export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type AnalysisType = 'summary' | 'outline' | 'style' | 'settings' | 'relationships' | 'theme' | 'plotholes';

export interface AnalysisResult {
  type: AnalysisType;
  content: string;
  status: AnalysisStatus;
  error?: string;
}

export interface ChunkData {
  id: number;
  originalText: string;
  summary: string;
  status: AnalysisStatus;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
}

export interface ProcessedContext {
  summary: string;
  tokenUsageEstimate: number; // Rough estimate saved
}

export interface PromptConfig {
  system: string;
  user: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: AnalysisType;
  config: PromptConfig;
  isBuiltIn?: boolean;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
