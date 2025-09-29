import type { NextApiRequest, NextApiResponse } from 'next';
import { CvEvaluationResponse } from '@/types';

declare global {
    // Extend globalThis to include evaluationStore
    var evaluationStore: Record<string, CvEvaluationResponse> | undefined;
}

// Simulated evaluation store (must match the one in evaluate-cv)
const evaluationStore: Record<string, CvEvaluationResponse> = globalThis.evaluationStore || (globalThis.evaluationStore = {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const evaluationId = req.query.id as string;

    if (!evaluationId) {
        res.status(400).json({ error: 'Evaluation ID is required' });
        return;
    }

    const evaluation = evaluationStore[evaluationId];
    if (!evaluation) {
        res.status(404).json({ error: 'Evaluation not found.' });
        return;
    }

    if (evaluation.status === 'processing' || evaluation.status === 'pending') {
        res.status(200).json({
            evaluationId,
            status: evaluation.status
        } as CvEvaluationResponse);
        return;
    }

    // Completed or failed
    res.status(200).json(evaluation);
}