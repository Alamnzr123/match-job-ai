export interface CvUploadRequest {
    file: File;
}

export interface LLMResponse {
    matchRate: string;
    feedback: string;
}

export interface CvEvaluationRequest {
    cvId: string;
    jobDescription: string;
}

export interface CV {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills: string[];
    experience: string[];
    education: string[];
    certifications?: string[];
    languages?: string[];
    projects?: string[];
    text: string; // Full text of the CV
}

export interface JobDescription {
    title: string;
    company: string;
    location: string;
    responsibilities: string[];
    requirements: string[];
    preferredQualifications?: string[];
    benefits?: string[];
}

export interface CvEvaluationResult {
    evaluationId: string;
    matchRate: number;
    feedback: string;
    score?: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface CvUploadResponse {
    cvId: string;
    message: string;
}

export interface CvEvaluationResponse {
    evaluationId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
}