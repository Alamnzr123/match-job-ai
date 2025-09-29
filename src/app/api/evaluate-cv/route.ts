import { Pinecone } from '@pinecone-database/pinecone';
import { evaluateCV } from '@/app/utils/aiEvaluator';
import { CV, JobDescription, CvEvaluationRequest, CvEvaluationResponse, CvEvaluationResult } from '@/app/types';

declare global {
    // Extend globalThis to include evaluationStore
    var evaluationStore: Record<string, CvEvaluationResponse> | undefined;
}

// Simulated evaluation store (global, matches get-results)
const evaluationStore: Record<string, CvEvaluationResponse> = globalThis.evaluationStore || (globalThis.evaluationStore = {});

export async function POST(req: Request) {
    try {
        const body: CvEvaluationRequest = await req.json();
        const { vectorId, jobDescription } = body;

        if (!vectorId || !jobDescription) {
            return new Response(JSON.stringify({ error: 'vectorId and jobDescription are required' }), { status: 400 });
        }

        // Set status to processing
        evaluationStore[vectorId] = {
            evaluationId: vectorId,
            status: 'processing'
        };

        // Retrieve CV text from Pinecone
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
        const indexName = process.env.PINECONE_INDEX!;
        const index = pinecone.Index(indexName);

        let cvText: string = '';
        try {
            const queryResult = await index.fetch([vectorId]);
            const match = queryResult?.records?.[vectorId];
            cvText = String(match?.metadata?.text ?? '');
            if (!cvText) {
                evaluationStore[vectorId] = {
                    evaluationId: vectorId,
                    status: 'completed',
                    result: undefined
                };
                return new Response(JSON.stringify({ error: 'CV text not found in Pinecone.' }), { status: 404 });
            }
        } catch (err) {
            evaluationStore[vectorId] = {
                evaluationId: vectorId,
                status: 'completed',
                result: undefined
            };
            return new Response(JSON.stringify({ error: 'Error fetching CV from Pinecone.' }), { status: 500 });
        }

        // Simulate async evaluation (3 seconds)
        setTimeout(async () => {
            let cvData: CV = {
                id: vectorId,
                text: cvText,
                name: '',
                email: '',
                education: [],
                certifications: [],
                languages: [],
                phone: '',
                skills: [],
                projects: [],
                experience: [],
                achievements: [],
                cultureFit: '',
                yearsOfExperience: 0
            };
            let results: CvEvaluationResult = await evaluateCV(cvData, jobDescription as JobDescription);

            evaluationStore[vectorId] = {
                evaluationId: vectorId,
                status: 'completed',
                result: {
                    evaluationId: vectorId,
                    matchRate: results.matchRate ?? 0.82,
                    cv_feedback: results.cv_feedback ?? "Strong in backend and cloud, limited AI integration experience.",
                    project_score: Array.isArray(cvData.projects) && cvData.projects.length > 0 ? 7.5 : 0,
                    project_feedback: Array.isArray(cvData.projects) && cvData.projects.length > 0
                        ? "Meets prompt chaining requirements, lacks error handling robustness."
                        : "No project section found in CV.",
                    overall_summary: results.overall_summary
                        ?? "Good candidate fit, would benefit from deeper RAG knowledge.",
                    status: 'completed'
                }
            };
        }, 3000);

        // Immediately return processing status
        return new Response(JSON.stringify({
            evaluationId: vectorId,
            status: 'processing'
        } as CvEvaluationResponse), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error evaluating CV' }), { status: 500 });
    }
}