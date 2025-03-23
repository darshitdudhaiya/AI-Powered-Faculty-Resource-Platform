export type Section = 'question-bank' | 'lesson-plan' | 'co-po-mapping' | 'course-material';

export interface SubjectDetails {
  code: string;
  name: string;
  syllabus: string;
}

export interface FileUploadResponse {
  success: boolean;
  data?: SubjectDetails;
  error?: string;
}

export interface GeneratedContent {
  content: string;
  timestamp: number;
}

export interface ContentCache {
  [key: string]: GeneratedContent;
}

export type ExportFormat = 'pdf' | 'csv' | 'pptx';