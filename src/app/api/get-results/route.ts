import { CvEvaluationResponse } from '@/app/types';

declare global {
    // Extend globalThis to include evaluationStore
    var evaluationStore: Record<string, CvEvaluationResponse> | undefined;
}

// Simulated evaluation store (must match the one in evaluate-cv)
const evaluationStore: Record<string, CvEvaluationResponse> = globalThis.evaluationStore || (globalThis.evaluationStore = {});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const evaluationId = searchParams.get('id');

    if (!evaluationId) {
        return new Response(JSON.stringify({ error: 'Evaluation ID is required' }), { status: 400 });
    }

    const evaluation = evaluationStore[evaluationId];
    if (!evaluation) {
        return new Response(JSON.stringify({ error: 'Evaluation not found.' }), { status: 404 });
    }

    if (evaluation.status === 'processing' || evaluation.status === 'pending') {
        return new Response(JSON.stringify({
            evaluationId,
            status: evaluation.status
        } as CvEvaluationResponse), { status: 200 });
    }

    // Completed or failed
    return new Response(JSON.stringify(evaluation), { status: 200 });
}