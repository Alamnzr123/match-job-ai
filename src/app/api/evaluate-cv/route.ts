import { Pinecone } from '@pinecone-database/pinecone';
import { evaluateCV } from '@/app/utils/aiEvaluator';
import { CV, JobDescription } from '@/app/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vectorId, jobDescription } = body;

        if (!vectorId || !jobDescription) {
            return new Response(JSON.stringify({ error: 'vectorId and jobDescription are required' }), { status: 400 });
        }

        // Retrieve text from Pinecone
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
        const indexName = process.env.PINECONE_INDEX!;
        const index = pinecone.Index(indexName);

        let cvText: string = '';
        try {
            const queryResult = await index.fetch([vectorId]);
            // Pinecone's fetch returns .records for the current SDK
            const match = queryResult?.records?.[vectorId];
            cvText = match?.metadata?.text !== undefined ? String(match.metadata.text) : '';
            if (!cvText) {
                return new Response(JSON.stringify({ error: 'CV text not found in Pinecone.' }), { status: 404 });
            }
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Error fetching CV from Pinecone.' }), { status: 500 });
        }

        let evaluationResult;
        try {
            // If your evaluateCV expects a CV object, parse cvText as JSON
            let cvData: CV;
            try {
                cvData = JSON.parse(cvText);
            } catch {
                // If cvText is plain text, pass as is
                cvData = {
                    id: '',
                    name: '',
                    email: '',
                    phone: '',
                    education: [],
                    experience: [],
                    skills: [],
                    text: cvText
                };
            }
            evaluationResult = await evaluateCV(cvData, jobDescription as JobDescription);
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Error evaluating CV.' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            evaluationId: vectorId,
            matchRate: evaluationResult.matchRate,
            score: evaluationResult.score,
            feedback: evaluationResult.feedback,
        }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error evaluating CV' }), { status: 500 });
    }
}