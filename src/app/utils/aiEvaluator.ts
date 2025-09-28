import { JobDescription, CV, CvEvaluationResult } from '../types';

export const evaluateCV = async (cv: CV, jobDescription: JobDescription): Promise<CvEvaluationResult> => {
    const prompt = createPrompt(cv, jobDescription);

    const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY_WRITE}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        }
    );

    const data = await response.json();

    // Parse the summary as feedback, and use a mock match rate
    const feedback = Array.isArray(data) && data[0]?.summary_text
        ? data[0].summary_text
        : 'No feedback generated.';

    // You can implement more advanced scoring logic if needed
    return {
        matchRate: Math.random(), // Mock match rate (0-1)
        feedback,
        evaluationId: '', // Provide a unique ID if available
        status: 'completed',
    };
};

const createPrompt = (cv: CV, jobDescription: JobDescription): string => {
    return `Evaluate the following CV against the job description. 
    CV: ${JSON.stringify(cv)}
    Job Description: ${JSON.stringify(jobDescription)}
    Please summarize the candidate's fit and provide feedback.`;
};