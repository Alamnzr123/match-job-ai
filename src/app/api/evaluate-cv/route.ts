import { evaluateCV } from '@/app/utils/aiEvaluator';
import { readFileContent } from '@/app/utils/fileHandler';
import { CV, JobDescription } from '@/app/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cvId, jobDescription } = body;

        if (!cvId || !jobDescription) {
            return new Response(JSON.stringify({ error: 'cvId and jobDescription are required' }), { status: 400 });
        }

        let cvDataString;
        try {
            cvDataString = await readFileContent(cvId);
        } catch (err) {
            return new Response(JSON.stringify({ error: 'CV file not found or unreadable.' }), { status: 404 });
        }

        let cvData;
        try {
            cvData = JSON.parse(cvDataString);
        } catch (err) {
            return new Response(JSON.stringify({ error: 'CV file is not valid JSON.' }), { status: 400 });
        }

        let evaluationResult;
        try {
            evaluationResult = await evaluateCV(cvData, jobDescription);
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Error evaluating CV.' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            evaluationId: cvId,
            matchRate: evaluationResult.matchRate,
            score: evaluationResult.score,
            feedback: evaluationResult.feedback,
        }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error evaluating CV' }), { status: 500 });
    }
}