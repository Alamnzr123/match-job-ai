import { LLMResponse } from '../types';

export const createEvaluationPrompt = (cvText: string, jobDescription: string): string => {
    return `Evaluate the following CV against the job description. Provide a match rate and feedback.

CV:
${cvText}

Job Description:
${jobDescription}`;
};

export const parseLLMResponse = (response: LLMResponse): { matchRate: number; feedback: string } => {
    const matchRate = extractMatchRate(response);
    const feedback = extractFeedback(response);
    return { matchRate, feedback };
};

const extractMatchRate = (response: LLMResponse): number => {
    // Logic to extract match rate from the LLM response
    return parseFloat(response.matchRate);
};

const extractFeedback = (response: LLMResponse): string => {
    // Logic to extract feedback from the LLM response
    return response.feedback;
};