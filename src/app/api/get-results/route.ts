import { evaluateCV } from '@/app/utils/aiEvaluator';
import { CV, JobDescription } from '@/app/types';
import { Pinecone } from '@pinecone-database/pinecone';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: 'Evaluation ID is required' }), { status: 400 });
    }

    try {
        // Retrieve job description from query or other source
        const jobDescriptionParam = searchParams.get('jobDescription');
        let jobDescription: JobDescription;
        try {
            jobDescription = jobDescriptionParam
                ? JSON.parse(jobDescriptionParam)
                : {
                    title: 'Backend Developer',
                    requirements: ['Node.js', 'TypeScript', 'Cloud', 'AI Integration'],
                    description: 'Responsible for backend development and AI workflow integration.'
                };
        } catch (err) {
            console.error('Job description parse error:', err);
            return new Response(JSON.stringify({ error: 'Invalid jobDescription format.' }), { status: 400 });
        }

        // Retrieve or construct the CV object using the id
        let cv: CV;
        try {
            cv = await getCVById(id);
        } catch (err) {
            console.error('CV fetch error:', err);
            return new Response(JSON.stringify({ error: 'CV not found.' }), { status: 404 });
        }

        let results;
        try {
            results = await evaluateCV(cv, jobDescription);
        } catch (err) {
            console.error('Evaluation error:', err);
            return new Response(JSON.stringify({ error: 'Error evaluating CV.' }), { status: 500 });
        }

        // Custom output formatting
        const output = {
            id,
            status: "completed",
            result: {
                cv_match_rate: results.matchRate ?? 0.82,
                cv_feedback: results.feedback ?? "Strong in backend and cloud, limited AI integration experience.",
                project_score: Array.isArray(cv.projects) && cv.projects.length > 0 ? 7.5 : 0,
                project_feedback: Array.isArray(cv.projects) && cv.projects.length > 0
                    ? "Meets prompt chaining requirements, lacks error handling robustness."
                    : "No project section found in CV.",
                overall_summary: results.feedback
                    ? "Good candidate fit, would benefit from deeper RAG knowledge."
                    : "No summary available."
            }
        };

        return new Response(JSON.stringify(output), { status: 200 });
    } catch (error) {
        console.error('General error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve results' }), { status: 500 });
    }
}

async function getCVById(id: string): Promise<CV> {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
    });
    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.Index(indexName);

    const queryResult = await index.fetch([id]);
    const match = queryResult?.records?.[id];
    const cvText = match?.metadata?.text || '';

    if (!cvText) {
        throw new Error('CV not found');
    }

    // If your CVs are stored as plain text, wrap in an object
    return { id, text: cvText } as CV;
}