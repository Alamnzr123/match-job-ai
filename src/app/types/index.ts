export interface CvUploadRequest {
    file: File;
}

export interface LLMResponse {
    matchRate: string; // e.g., "85.5"
    feedback: string;
}

export interface CvUploadResponse {
    cvId: string;
    message: string;
}

export interface CvEvaluationRequest {
    vectorId: string; // Changed from cvId to vectorId for Pinecone workflow
    jobDescription: JobDescription;
}

export interface CvEvaluationResponse {
    evaluationId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: CvEvaluationResult;
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
    achievements?: string[];
    cultureFit?: string;
    text: string; // Full text of the CV
    yearsOfExperience?: number;
}

export interface JobDescription {
    title: string;
    company?: string;
    location?: string;
    responsibilities?: string[];
    requirements: string[];
    preferredQualifications?: string[];
    benefits?: string[];
    description?: string;
}

export interface CvEvaluationResult {
    evaluationId: string;
    matchRate: number;
    cv_feedback: string;
    project_score?: number;
    project_feedback?: string;
    overall_summary?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}