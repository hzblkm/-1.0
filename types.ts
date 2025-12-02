
export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type AnalysisType = 'outline' | 'style' | 'settings';

export interface AnalysisResult {
  type: AnalysisType;
  content: string;
  status: AnalysisStatus;
  error?: string;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
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
