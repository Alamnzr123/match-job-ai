import { OpenAI } from 'openai'; // Import OpenAI library

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
});

import { JobDescription, CV, CvEvaluationResult } from '../types';

export const evaluateCV = async (cv: CV, jobDescription: JobDescription): Promise<CvEvaluationResult> => {
    const prompt = createPrompt(cv, jobDescription);

    // Use OpenAI to generate response
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
    });
    const response = completion.choices[0].message.content ?? '';

    return parseResponse(response);
};

const createPrompt = (cv: CV, jobDescription: JobDescription): string => {
    return `Evaluate the following CV against the job description. 
    CV: ${JSON.stringify(cv)}
    Job Description: ${JSON.stringify(jobDescription)}`;
};

const parseResponse = (response: string): CvEvaluationResult => {
    // Implement parsing logic based on the expected response format
    const matchRate = extractMatchRate(response);
    const feedback = extractFeedback(response);

    return {
        matchRate,
        feedback,
        evaluationId: '', // Provide a unique ID if available
        status: 'completed', // Or another appropriate status value
    };
};

const extractMatchRate = (response: string): number => {
    // Logic to extract match rate from the response
    const match = response.match(/Match Rate: (\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

const extractFeedback = (response: string): string => {
    // Logic to extract feedback from the response
    const match = response.match(/Feedback: (.+)/);
    return match ? match[1].trim() : '';
};