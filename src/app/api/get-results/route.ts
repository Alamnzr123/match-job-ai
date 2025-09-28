import { NextApiRequest, NextApiResponse } from 'next';
import { evaluateCV } from '@/app/utils/aiEvaluator';
import { CV, JobDescription } from '@/app/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Evaluation ID is required' });
        }

        try {
            // Retrieve job description from query or other source
            const jobDescription: JobDescription = req.query.jobDescription
                ? JSON.parse(req.query.jobDescription as string)
                : {
                    title: 'Backend Developer',
                    requirements: ['Node.js', 'TypeScript', 'Cloud', 'AI Integration'],
                    description: 'Responsible for backend development and AI workflow integration.'
                };

            // Retrieve or construct the CV object using the id
            const cv: CV = await getCVById(id as string);

            const results = await evaluateCV(cv, jobDescription);
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to retrieve results' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Dummy implementation: Replace with actual DB call or data source
async function getCVById(id: string): Promise<CV> {
    // Simulate fetching from a database
    const dummyCVs: CV[] = [
        {
            id: '1',
            name: 'Alice Smith',
            experience: ['Software Engineer at XYZ', 'Frontend Developer at ABC'],
            skills: ['TypeScript', 'React', 'Node.js'],
            education: ['B.Sc. Computer Science'],
            certifications: ['Certified Kubernetes Administrator'],
            languages: ['English', 'French'],
            projects: ['E-commerce site', 'Portfolio website'],
            phone: '987-654-3210',
            email: ''
        },
        {
            id: '2',
            name: 'Bob Johnson',
            experience: ['Backend Developer at DEF'],
            skills: ['Python', 'Django', 'PostgreSQL'],
            education: ['M.Sc. Software Engineering'],
            certifications: ['AWS Certified Solutions Architect'],
            languages: ['English', 'Spanish'],
            projects: ['E-commerce platform', 'Real-time chat application'],
            phone: '123-456-7890',
            email: ''
        }
    ];
    const cv = dummyCVs.find(cv => cv.id === id);
    if (!cv) {
        throw new Error('CV not found');
    }
    return cv;
}
